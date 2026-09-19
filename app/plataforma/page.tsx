import { OrganizationsClient } from "@/features/organizations/OrganizationsClient";
import { listOrganizations } from "@/features/organizations/queries";

export default async function PlataformaHome() {
  const organizations = await listOrganizations();

  return <OrganizationsClient organizations={organizations} />;
}
