-- ============================================================================
-- 0017: reportes automaticos por email (Fase 6 del plan multitenant, seccion 9).
--
-- `report_email_schedules` es 1 fila por organizacion (igual patron que
-- `system_settings`): que reportes mandar, con que frecuencia y a que
-- correo. `scheduled_job_runs` es el historial compartido de corridas,
-- pensado para reutilizarse tambien con los backups reales (Fase 7) --
-- por eso la columna `kind`.
-- ============================================================================

create table report_email_schedules (
  organization_id  uuid primary key references organizations(id),
  enabled          boolean not null default false,
  recipient_email  text,
  frequency        text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  day_of_week      int check (day_of_week between 0 and 6),
  day_of_month     int check (day_of_month between 1 and 28),
  report_types     text[] not null default '{}',
  updated_by       uuid references profiles(id),
  updated_at       timestamptz not null default now()
);

create table scheduled_job_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id),
  kind             text not null check (kind in ('report_email', 'backup')),
  status           text not null check (status in ('success', 'error')),
  detail           jsonb,
  duration_ms      int,
  created_at       timestamptz not null default now()
);

create index ix_scheduled_job_runs_org on scheduled_job_runs (organization_id, kind, created_at desc);

alter table report_email_schedules enable row level security;
alter table scheduled_job_runs      enable row level security;

-- Solo el Administrador de la propia organizacion -- a diferencia de
-- system_settings (que un dirigente tambien necesita leer para saber si la
-- carga esta habilitada), esto es exclusivamente de gestion administrativa.
create policy report_email_schedules_select on report_email_schedules for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

create policy scheduled_job_runs_select on scheduled_job_runs for select
  using (
    (select role from fn_profile_context()) = 'superadmin'
    and organization_id = (select organization_id from fn_profile_context())
  );

-- Nadie tiene INSERT/UPDATE/DELETE directo (mismo principio de siempre):
-- report_email_schedules se escribe solo via fn_set_report_email_schedule;
-- scheduled_job_runs lo escribe unicamente el cron/GitHub Action con
-- service_role, nunca una sesion de usuario.

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

grant select on report_email_schedules, scheduled_job_runs to authenticated;
grant execute on function fn_set_report_email_schedule(boolean, text, text, int, int, text[], text, text) to authenticated;
