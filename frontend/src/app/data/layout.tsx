export default function DataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="scroll-slim flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
    </main>
  );
}
