interface PromptHeaderProps {
  prompt: string;
}

export function PromptHeader({ prompt }: PromptHeaderProps) {
  return (
    <section className="relative mb-4 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 shadow-sm">
      <span className="absolute -top-2 left-4 h-4 w-8 rotate-[-8deg] rounded bg-rose-200/80" />
      <p className="font-hand text-sm text-amber-900">Current Prompt</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{prompt}</p>
    </section>
  );
}
