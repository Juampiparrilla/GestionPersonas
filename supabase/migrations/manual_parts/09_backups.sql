-- ============================================================================
-- 0018: backup real (Fase 7 del plan multitenant, seccion 12).
-- ============================================================================

create or replace function fn_set_backup_schedule(
  p_enabled boolean,
  p_frequency text,
  p_day_of_week int,
  p_day_of_month int,
  p_retention_count int,
  p_ip text default null,
  p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  ctx record;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;
  if p_frequency not in ('daily', 'weekly', 'monthly') then
    raise exception 'Frecuencia invalida';
  end if;
  if p_retention_count < 1 or p_retention_count > 60 then
    raise exception 'Retencion invalida';
  end if;

  insert into backup_schedules(
    organization_id, enabled, frequency, day_of_week, day_of_month, retention_count, updated_by, updated_at
  ) values (
    ctx.organization_id, p_enabled, p_frequency, p_day_of_week, p_day_of_month, p_retention_count, ctx.profile_id, now()
  )
  on conflict (organization_id) do update set
    enabled = excluded.enabled,
    frequency = excluded.frequency,
    day_of_week = excluded.day_of_week,
    day_of_month = excluded.day_of_month,
    retention_count = excluded.retention_count,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  perform fn_write_audit(
    'BACKUP_SCHEDULE_UPDATED', 'backup_schedule', ctx.organization_id,
    null, null, null, null,
    jsonb_build_object('enabled', p_enabled, 'frequency', p_frequency),
    p_ip, p_user_agent
  );
end;
$$;
