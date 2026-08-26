import "server-only";

// Fijo para este proyecto -- no hace falta una env var mas, el repo no
// cambia.
const OWNER = "Juampiparrilla";
const REPO = "GestionPersonas";
const WORKFLOW_FILE = "backup.yml";

export type TriggerBackupResult = { ok: true } | { ok: false; error: string };

// Dispara el mismo workflow de GitHub Actions que corre solo todos los
// dias (ver .github/workflows/backup.yml) -- "Generar respaldo ahora"
// reutiliza EXACTAMENTE la misma logica en vez de duplicarla, pedido
// explicito del diseno (seccion 12).
export async function triggerBackupWorkflow(organizationId: string): Promise<TriggerBackupResult> {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) {
    return { ok: false, error: "Falta configurar GITHUB_ACTIONS_TOKEN en el servidor." };
  }

  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { organization_id: organizationId } }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: `GitHub respondió ${response.status}: ${text}` };
  }

  return { ok: true };
}
