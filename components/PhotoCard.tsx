import { PhotoRecord } from "@/lib/types";

interface PhotoCardProps {
  photo: PhotoRecord;
  index: number;
}

const ROTATIONS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function PhotoCard({ photo, index }: PhotoCardProps) {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const formattedDate = new Date(photo.timestamp).toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  });

  return (
    <article className={`relative rounded-2xl border border-slate-200 bg-white p-3 shadow-md ${rotation}`}>
      <span className="absolute -top-2 left-4 h-5 w-10 rotate-[-10deg] rounded bg-yellow-200/90" />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.image_url} alt="Captured moment" className="aspect-[4/5] w-full object-cover" loading="lazy" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="line-clamp-1 text-xs text-slate-500">{photo.prompt || "No prompt"}</p>
        <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-1 font-hand text-xs text-cyan-700">{formattedDate}</span>
      </div>
    </article>
  );
}
