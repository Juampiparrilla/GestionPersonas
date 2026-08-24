export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">¿No podés entrar?</h1>
      <p className="max-w-sm text-zinc-600">
        Pedile a la persona que administra el sistema en tu organización que te reenvíe el
        acceso. No hace falta ningún correo electrónico.
      </p>
      <a href="/login" className="text-sm text-zinc-600 underline underline-offset-2">
        Volver
      </a>
    </div>
  );
}
