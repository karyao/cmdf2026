"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";

const Webcam = dynamic(() => import("react-webcam"), { ssr: false });

interface CameraModuleProps {
  prompt: string;
  onCapture: (imageData: string) => Promise<void>;
  uploading: boolean;
}

export function CameraModule({ prompt, onCapture, uploading }: CameraModuleProps) {
  const webcamRef = useRef<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoConstraints = useMemo(
    () => ({ facingMode: "user", width: 720, height: 900 }),
    []
  );

  const startCapture = useCallback(() => {
    if (uploading || countdown !== null) return;

    let current = 3;
    setCountdown(current);

    const interval = window.setInterval(() => {
      current -= 1;
      if (current <= 0) {
        window.clearInterval(interval);
        const shot = webcamRef.current?.getScreenshot?.();
        setCountdown(null);
        if (shot) {
          void onCapture(shot);
        }
        return;
      }
      setCountdown(current);
    }, 700);
  }, [countdown, onCapture, uploading]);

  return (
    <section className="mb-5 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
      <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50">
        <span className="absolute left-3 top-2 text-lg">✨</span>
        <span className="absolute right-3 top-2 text-lg">🌼</span>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.9}
          videoConstraints={videoConstraints}
          className="aspect-[3/4] w-full object-cover"
        />

        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/40">
            <div className="h-16 w-16 rounded-full bg-white/90 text-center font-hand text-4xl leading-[4rem] text-rose-500">
              {countdown}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-xs text-slate-500">{prompt}</p>
        <button
          type="button"
          onClick={startCapture}
          disabled={uploading || countdown !== null}
          className="h-14 w-14 shrink-0 rounded-full border-4 border-white bg-rose-500 shadow-[0_10px_20px_-12px_rgba(244,63,94,0.9)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Capture photo"
        >
          <span className="block h-full w-full rounded-full border-2 border-rose-200" />
        </button>
      </div>
      {uploading && <p className="mt-2 text-xs text-rose-500">Uploading to your scrapbook...</p>}
    </section>
  );
}
