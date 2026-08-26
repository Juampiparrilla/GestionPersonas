-- ============================================================================
-- 0018: backup real (Fase 7 del plan multitenant, seccion 12).
--
-- El dump en si es UNO SOLO para toda la base (pg_dump vía GitHub Actions,
-- no por organizacion -- ver el comentario largo en
-- .github/workflows/backup.yml sobre por que). `backup_schedules` es donde
-- cada organizacion elige "contarme" en ese backup compartido (que dia le
-- toca, segun su propia frecuencia) y `scheduled_job_runs` (ya creada en
-- 0017, reutilizada aca con kind='backup') es su historial: no ven el
-- archivo, solo que paso.
-- ============================================================================

create table backup_schedules (
  organization_id  uuid primary key references organizations(id),
  enabled          boolean not null default false,
  frequency        text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  day_of_week      int check (day_of_week between 0 and 6),
  day_of_month     int check (day_of_month between 1 and 28),
  retention_count  int not null default 7 check (retention_count between 1 and 60),
  updated_by       uuid references profiles(id),
  updated_at       timestamptz not null default now()
);

alter table backup_schedules enable row level security;

create policy backup_schedules_select on backup_schedules for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

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

grant select on backup_schedules to authenticated;
grant execute on function fn_set_backup_schedule(boolean, text, int, int, int, text, text) to authenticated;
