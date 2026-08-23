import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Recuperar contraseña</h1>
        <p className="text-zinc-600">Te enviamos un link para elegir una nueva.</p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
