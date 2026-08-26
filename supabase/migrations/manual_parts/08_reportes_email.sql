-- ============================================================================
-- 0017: reportes automaticos por email (Fase 6 del plan multitenant, seccion 9).
-- ============================================================================

create or replace function fn_set_report_email_schedule(
  p_enabled boolean,
  p_recipient_email text,
  p_frequency text,
  p_day_of_week int,
  p_day_of_month int,
  p_report_types text[],
  p_ip text default null,
  p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  ctx record;
  v_before report_email_schedules%rowtype;
begin
  select * into ctx from fn_require_profile();
  if ctx.role <> 'superadmin' then
    raise exception 'No autorizado';
  end if;
  if p_frequency not in ('daily', 'weekly', 'monthly') then
    raise exception 'Frecuencia invalida';
  end if;

  select * into v_before from report_email_schedules where organization_id = ctx.organization_id;

  insert into report_email_schedules(
    organization_id, enabled, recipient_email, frequency, day_of_week, day_of_month, report_types,
    updated_by, updated_at
  ) values (
    ctx.organization_id, p_enabled, p_recipient_email, p_frequency, p_day_of_week, p_day_of_month, p_report_types,
    ctx.profile_id, now()
  )
  on conflict (organization_id) do update set
    enabled = excluded.enabled,
    recipient_email = excluded.recipient_email,
    frequency = excluded.frequency,
    day_of_week = excluded.day_of_week,
    day_of_month = excluded.day_of_month,
    report_types = excluded.report_types,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  -- Pedido explicito (seccion 14 del diseno): cada cambio de destinatario
  -- queda auditado con before/after, no solo "se actualizo la config".
  if v_before.recipient_email is distinct from p_recipient_email then
    perform fn_write_audit(
      'REPORT_EMAIL_RECIPIENT_CHANGED', 'report_email_schedule', ctx.organization_id,
      null, null, null,
      jsonb_build_object('recipient_email', v_before.recipient_email),
      jsonb_build_object('recipient_email', p_recipient_email),
      p_ip, p_user_agent
    );
  end if;
end;
$$;
