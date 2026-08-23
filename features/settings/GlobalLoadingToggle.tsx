import { setGlobalLoadingAction } from "./actions";

export function GlobalLoadingToggle({ loadingEnabled }: { loadingEnabled: boolean }) {
  const toggle = setGlobalLoadingAction.bind(null, !loadingEnabled);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-zinc-900">
          {loadingEnabled ? "🟢 Carga habilitada" : "🔴 Carga cerrada"}
        </p>
        <p className="text-sm text-zinc-600">
          {loadingEnabled
            ? "Los dirigentes pueden agregar y editar información."
            : "Los dirigentes solo pueden consultar, no pueden agregar ni editar nada."}
        </p>
      </div>
      <form action={toggle}>
        <button
          type="submit"
          className="h-12 w-full rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:w-auto"
        >
          {loadingEnabled ? "🔒 Cerrar carga" : "🔓 Habilitar carga"}
        </button>
      </form>
    </div>
  );
}
