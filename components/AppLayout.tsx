import { PropsWithChildren } from "react";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-[var(--bg-cream)] px-4 py-6 text-slate-800">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-rose-100 bg-[var(--paper)]/95 p-4 shadow-[0_20px_45px_-28px_rgba(30,41,59,0.45)]">
        <header className="sticky top-0 z-20 mb-4 rounded-2xl border border-rose-200/80 bg-[var(--paper)]/95 px-4 py-3 backdrop-blur">
          <p className="font-hand text-sm tracking-wide text-rose-500">scrapbook social</p>
          <h1 className="text-xl font-semibold">Day in the Life</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
