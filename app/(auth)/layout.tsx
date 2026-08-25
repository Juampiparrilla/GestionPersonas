export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm shadow-zinc-200/60">
        {children}
      </div>
    </div>
  );
}
