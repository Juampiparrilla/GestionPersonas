import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type OrganizationListItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  adminProfileId: string | null;
  adminFullName: string | null;
  adminAccepted: boolean;
};

// Solo platform_admin puede ver esto -- la policy org_select ya lo exige
// del lado de la base (defensa real), esto evita ademas la query inutil.
export async function listOrganizations(): Promise<OrganizationListItem[]> {
  const session = await getSessionContext();
  if (!session || session.role !== "platform_admin") return [];

  const supabase = await createClient();

  const [{ data: orgs, error: orgsError }, { data: admins, error: adminsError }] = await Promise.all([
    supabase.from("organizations").select("id, name, is_active, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, organization_id, full_name, password_set_at").eq("role", "superadmin"),
  ]);

  if (orgsError) throw new Error(orgsError.message);
  if (adminsError) throw new Error(adminsError.message);

  const adminByOrg = new Map((admins ?? []).map((admin) => [admin.organization_id, admin]));

  return (orgs ?? []).map((org) => {
    const admin = adminByOrg.get(org.id);
    return {
      id: org.id,
      name: org.name,
      isActive: org.is_active,
      createdAt: org.created_at,
      adminProfileId: admin?.id ?? null,
      adminFullName: admin?.full_name ?? null,
      adminAccepted: Boolean(admin?.password_set_at),
    };
  });
}
