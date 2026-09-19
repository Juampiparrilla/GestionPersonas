import { PageLoading } from "@/components/PageLoading";

// Cada pantalla tiene su propio loading: al navegar entre pantallas de una
// misma seccion, Next.js solo muestra el spinner si la pantalla de destino
// tiene su propio limite de carga (con uno solo por seccion, la pantalla
// anterior se queda "colgada" hasta que la nueva termina de cargar).
export default function Loading() {
  return <PageLoading />;
}
