import { PhotoRecord } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { PhotoCard } from "@/components/PhotoCard";

interface TimelineFeedProps {
  photos: PhotoRecord[];
  loading: boolean;
}

export function TimelineFeed({ photos, loading }: TimelineFeedProps) {
  if (loading) {
    return <p className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-500">Loading timeline...</p>;
  }

  if (!photos.length) {
    return <EmptyState />;
  }

  return (
    <section className="space-y-4">
      {photos.map((photo, index) => (
        <PhotoCard key={photo._id} photo={photo} index={index} />
      ))}
    </section>
  );
}
