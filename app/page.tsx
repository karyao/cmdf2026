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
      const response = await fetch("/api/photos", { cache: "no-store" });
      const payload = await response.json();
      setPhotos(payload.photos ?? []);
    } catch (error) {
      console.error("Failed to fetch photos", error);
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
        const response = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData, prompt, userId: "guest" })
        });

        if (!response.ok) {
          throw new Error("Failed to upload photo");
        }

        const payload = await response.json();
        setPhotos((prev) => [payload.photo, ...prev]);
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
