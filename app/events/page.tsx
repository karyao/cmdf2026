import { AppLayout } from "@/components/AppLayout";

const attendees = [
  { name: "You", color: "bg-emerald-400", isYou: true },
  { name: "Ari", color: "bg-rose-300" },
  { name: "Noah", color: "bg-amber-300" },
  { name: "Mina", color: "bg-sky-300" },
  { name: "Leo", color: "bg-violet-300" }
];

export default function EventsPage() {
  return (
    <AppLayout>
      <section className="space-y-4">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-hand text-sm tracking-wide text-emerald-700">You joined this event</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sunset Photo Walk</h2>
              <p className="text-sm text-slate-600">Today, 6:30 PM • Kitsilano Beach</p>
            </div>
            <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Joined
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Meet at the volleyball courts. Golden hour challenge: capture one candid + one silhouette.
          </p>
          <div className="mt-4">
            <button
              type="button"
              aria-label="Joined event"
              className="w-full rounded-2xl border border-emerald-300 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm opacity-95"
            >
              ✓ Joined
            </button>
          </div>
        </div>

        <article className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attendees</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {attendees.map((person) => (
              <div
                key={person.name}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${person.color}`} />
                <span className="text-sm text-slate-700">
                  {person.name}
                  {person.isYou ? " (you)" : ""}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Event Plan</h3>
          <ol className="mt-3 space-y-3 text-sm text-slate-700">
            <li className="rounded-2xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-900">6:30 PM:</span> Check-in + group selfie
            </li>
            <li className="rounded-2xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-900">6:50 PM:</span> Prompt drop: "Motion & Light"
            </li>
            <li className="rounded-2xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-900">7:20 PM:</span> Share top shot in timeline
            </li>
          </ol>
        </article>
      </section>
    </AppLayout>
  );
}
