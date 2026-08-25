// Tipos escritos a mano para tipar los clientes de Supabase, siguiendo
// exactamente supabase/migrations/0001_init.sql + 0002_fix_rls_tenant_isolation.sql.
// Si en algun momento se configura Supabase CLI con login, se puede
// reemplazar por el generador oficial:
//
//   npx supabase gen types typescript --project-id <ref> > types/database.ts

import type {
  IndividualPosition,
  IndividualStatus,
  LeaderAccessStatus,
  UserRole,
  VehicleType,
} from "./domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Ninguna de estas tablas se inserta/actualiza directo desde el cliente: RLS
// no tiene policies de escritura para ellas (ver seccion 10-11 de la
// migracion), toda mutacion pasa por las funciones RPC de la seccion
// "Functions" de abajo. Insert/Update quedan tipados igual que Row solo para
// satisfacer la forma que pide postgrest-js, no porque se usen.
type ReadOnlyTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Row;
  Update: Partial<Row>;
  Relationships: [];
};

type OrganizationRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  // null solo para role === "platform_admin" (0014).
  organization_id: string | null;
  full_name: string;
  role: UserRole;
  leader_id: string | null;
  // 0015: login por DNI para roles sin fila en `individuals`.
  dni_normalized: string | null;
  created_at: string;
  password_set_at: string | null;
};

type IndividualRow = {
  id: string;
  organization_id: string;
  dni_normalized: string;
  dni_display: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  position: IndividualPosition | null;
  status: IndividualStatus;
  created_at: string;
  updated_at: string;
};

type LeaderRow = {
  id: string;
  profile_id: string | null;
  access_status: LeaderAccessStatus;
  is_removed: boolean;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
  created_by: string;
  created_at: string;
};

type PointerRow = {
  id: string;
  leader_id: string;
  is_removed: boolean;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
  created_by: string;
  created_at: string;
};

type RegisteredPersonRow = {
  id: string;
  pointer_id: string;
  is_removed: boolean;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
  created_by: string;
  created_at: string;
};

type VehicleRow = {
  id: string;
  organization_id: string;
  leader_id: string;
  type: VehicleType;
  plate_normalized: string;
  plate_display: string;
  driver_full_name: string;
  driver_dni_normalized: string;
  driver_phone: string | null;
  is_removed: boolean;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
  created_by: string;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_profile_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  leader_id: string | null;
  pointer_id: string | null;
  person_id: string | null;
  before_data: Json | null;
  after_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type SystemSettingsRow = {
  organization_id: string;
  loading_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
};

type RestoreResult = {
  restored: boolean;
  conflict: boolean;
  current_position?: IndividualPosition | null;
  individual_id?: string;
  restored_people_count?: number;
  conflicts?: Json;
};

export type Database = {
  public: {
    Tables: {
      organizations: ReadOnlyTable<OrganizationRow>;
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "leader_id" | "created_at" | "password_set_at"> &
          Partial<Pick<ProfileRow, "leader_id" | "created_at" | "password_set_at">>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      individuals: ReadOnlyTable<IndividualRow>;
      leaders: ReadOnlyTable<LeaderRow>;
      pointers: ReadOnlyTable<PointerRow>;
      registered_people: ReadOnlyTable<RegisteredPersonRow>;
      vehicles: ReadOnlyTable<VehicleRow>;
      audit_logs: ReadOnlyTable<AuditLogRow>;
      system_settings: ReadOnlyTable<SystemSettingsRow>;
    };
    Views: Record<string, never>;
    Functions: {
      fn_check_dni_availability: {
        Args: { p_dni: string };
        Returns: "available" | "blocked";
      };
      fn_admin_locate_dni: {
        Args: { p_dni: string };
        Returns: Json;
      };
      fn_admin_lookup_leader_profile: {
        Args: { p_dni: string };
        Returns: string | null;
      };
      fn_create_leader: {
        Args: {
          p_dni: string;
          p_full_name: string;
          p_phone: string | null;
          p_profile_id?: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      fn_update_leader: {
        Args: {
          p_leader_id: string;
          p_full_name: string;
          p_phone: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_remove_leader: {
        Args: {
          p_leader_id: string;
          p_reason?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_restore_leader: {
        Args: { p_leader_id: string; p_ip?: string | null; p_user_agent?: string | null };
        Returns: RestoreResult;
      };
      fn_set_leader_access_status: {
        Args: {
          p_leader_id: string;
          p_status: LeaderAccessStatus;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_set_global_loading: {
        Args: { p_enabled: boolean; p_ip?: string | null; p_user_agent?: string | null };
        Returns: undefined;
      };
      fn_create_organization: {
        Args: { p_org_name: string; p_ip?: string | null; p_user_agent?: string | null };
        Returns: string;
      };
      fn_set_organization_active: {
        Args: {
          p_organization_id: string;
          p_is_active: boolean;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_link_leader_profile: {
        Args: {
          p_leader_id: string;
          p_profile_id: string;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_mark_password_set: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      fn_create_pointer: {
        Args: {
          p_leader_id: string;
          p_dni: string;
          p_full_name: string;
          p_phone: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      fn_update_pointer: {
        Args: {
          p_pointer_id: string;
          p_full_name: string;
          p_phone: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_remove_pointer: {
        Args: {
          p_pointer_id: string;
          p_reason?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_create_person: {
        Args: {
          p_pointer_id: string;
          p_dni: string;
          p_full_name: string;
          p_phone: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      fn_update_person: {
        Args: {
          p_person_id: string;
          p_full_name: string;
          p_phone: string | null;
          p_address?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_remove_person: {
        Args: {
          p_person_id: string;
          p_reason?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_create_vehicle: {
        Args: {
          p_leader_id: string;
          p_type: VehicleType;
          p_plate: string;
          p_driver_full_name: string;
          p_driver_dni: string;
          p_driver_phone: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      fn_update_vehicle: {
        Args: {
          p_vehicle_id: string;
          p_type: VehicleType;
          p_plate: string;
          p_driver_full_name: string;
          p_driver_dni: string;
          p_driver_phone: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      fn_remove_vehicle: {
        Args: {
          p_vehicle_id: string;
          p_reason?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      individual_status: IndividualStatus;
      individual_position: IndividualPosition;
      leader_access_status: LeaderAccessStatus;
      vehicle_type: VehicleType;
    };
  };
};
