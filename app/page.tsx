"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CameraModule } from "@/components/CameraModule";
import { PromptHeader } from "@/components/PromptHeader";
import { TimelineFeed } from "@/components/TimelineFeed";
import { getPromptByHour } from "@/lib/prompts";
import { PhotoRecord } from "@/lib/types";

export default function HomePage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const prompt = useMemo(() => getPromptByHour(), []);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/media?type=photo", { cache: "no-store" });
      const payload = await response.json();
      // Map media response to PhotoRecord shape for the existing TimelineFeed
      setPhotos(
        (payload.media ?? []).map((item: any) => ({
          _id: item._id,
          image_url: item.media_url,
          timestamp: item.timestamp,
          prompt: item.prompt,
          user_id: item.user_id,
          event_id: item.event_id
        }))
      );
    } catch (error) {
      console.error("Failed to fetch media", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const handleCapture = useCallback(
    async (imageData: string) => {
      setUploading(true);
      try {
        const response = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData, prompt })
        });

        if (!response.ok) {
          throw new Error("Failed to upload photo");
        }

        const payload = await response.json();
        // Map the media response to PhotoRecord shape
        setPhotos((prev) => [
          {
            _id: payload.media._id,
            image_url: payload.media.media_url,
            timestamp: payload.media.timestamp,
            prompt: payload.media.prompt,
            user_id: payload.media.user_id,
            event_id: payload.media.event_id
          },
          ...prev
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    },
    [prompt]
  );

  return (
    <AppLayout>
      <PromptHeader prompt={prompt} />
      <CameraModule prompt={prompt} onCapture={handleCapture} uploading={uploading} />
      <TimelineFeed photos={photos} loading={loading} />
    </AppLayout>
  );
}
