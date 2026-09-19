// Barra inferior fija con la accion primaria de la pantalla, anclada al
// alcance del pulgar. Los 26px de padding inferior absorben el home
// indicator. Sustituye a la barra de navegacion (nunca se apilan).
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[448px] border-t border-line-head bg-bar px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-3">
      {children}
    </div>
  );
}
