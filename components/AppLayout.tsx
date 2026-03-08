import { PropsWithChildren } from "react";
import Image from "next/image";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-[var(--bg-cream)] px-[max(1.75rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-[max(1rem,env(safe-area-inset-top))] text-slate-800 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-rose-100 bg-[var(--paper)]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 shadow-[0_20px_45px_-28px_rgba(30,41,59,0.45)] sm:px-4 sm:pb-6 sm:pt-4">
        <header className="sticky top-0 z-20 mb-3 rounded-2xl border border-rose-200/80 bg-[var(--paper)]/95 px-4 py-3 backdrop-blur sm:mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-hand text-sm tracking-wide text-rose-500">scrapbook social</p>
              <h1 className="text-xl font-semibold">Day in the Life</h1>
            </div>
            <Image src="/logo.png" alt="App logo" width={74} height={74} className="h-[74px] w-[74px] object-contain" priority />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
