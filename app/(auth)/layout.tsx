// Login y demas pantallas de acceso: columna centrada verticalmente sobre el
// fondo de la app, sin tarjeta ni barra inferior.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[448px] flex-1 flex-col justify-center gap-[30px] bg-app px-[26px] pb-10 pt-10">
      {children}
    </div>
  );
}
