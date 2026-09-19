export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
        ¿No podés entrar?
      </h1>
      <p className="text-[15px] text-ink-2">
        Pedile a la persona que administra el sistema en tu organización que te reenvíe el
        acceso.
      </p>
      <a href="/login" className="inline-flex min-h-[44px] items-center text-sm font-medium text-link">
        Volver
      </a>
    </div>
  );
}
