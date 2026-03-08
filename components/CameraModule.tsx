"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type ReactWebcam from "react-webcam";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Webcam: any = dynamic((() => import("react-webcam")) as any, { ssr: false });

interface CameraModuleProps {
  prompt: string;
  onCapture: (imageData: string) => Promise<void>;
  uploading: boolean;
}

export function CameraModule({ prompt, onCapture, uploading }: CameraModuleProps) {
  const webcamRef = useRef<ReactWebcam | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoConstraints = useMemo(
    () => ({ facingMode: "user", width: 720, height: 900 }),
    []
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startCapture = useCallback(() => {
    if (uploading || countdown !== null || previewImage) return;

    let current = 3;
    setCountdown(current);

    intervalRef.current = window.setInterval(() => {
      current -= 1;
      if (current <= 0) {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const shot = webcamRef.current?.getScreenshot?.();
        setCountdown(null);
        if (shot) {
          setPreviewImage(shot);
        }
        return;
      }
      setCountdown(current);
    }, 700);
  }, [countdown, previewImage, uploading]);

  const retakePhoto = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCountdown(null);
    setPreviewImage(null);
  }, []);

  const confirmPhoto = useCallback(async () => {
    if (!previewImage || uploading) return;
    await onCapture(previewImage);
    setPreviewImage(null);
  }, [onCapture, previewImage, uploading]);

  return (
    <section className="mb-4 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm sm:mb-5">
      <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50">
        <span className="absolute left-3 top-2 text-lg">✨</span>
        <span className="absolute right-3 top-2 text-lg">🌼</span>
        {previewImage ? (
          <img src={previewImage} alt="Captured preview" className="aspect-[3/4] w-full object-cover" />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            className="aspect-[3/4] w-full object-cover"
            onUserMedia={() => setCameraError(null)}
            onUserMediaError={() =>
              setCameraError("Camera access is blocked. Allow permission and refresh to try again.")
            }
          />
        )}

        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/40">
            <div className="h-16 w-16 rounded-full bg-white/90 text-center font-hand text-4xl leading-[4rem] text-rose-500">
              {countdown}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="line-clamp-2 text-xs text-slate-500 sm:max-w-[60%]">{prompt}</p>
        {previewImage ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
            <button
              type="button"
              onClick={retakePhoto}
              disabled={uploading}
              className="min-h-11 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Take another
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              disabled={uploading}
              className="min-h-11 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_-12px_rgba(244,63,94,0.9)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Use photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startCapture}
            disabled={uploading || countdown !== null || !!cameraError}
            className="h-16 w-16 shrink-0 self-end rounded-full border-4 border-white bg-rose-500 shadow-[0_10px_20px_-12px_rgba(244,63,94,0.9)] transition hover:scale-[1.02] sm:self-auto disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Capture photo"
          >
            <span className="block h-full w-full rounded-full border-2 border-rose-200" />
          </button>
        )}
      </div>
      {uploading && <p className="mt-2 text-xs text-rose-500">Uploading to your scrapbook...</p>}
      {previewImage && !uploading && (
        <p className="mt-2 text-xs text-slate-500">Keep this photo, or tap "Take another".</p>
      )}
      {cameraError && <p className="mt-2 text-xs text-rose-500">{cameraError}</p>}
    </section>
  );
}
