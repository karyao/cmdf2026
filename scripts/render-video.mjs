#!/usr/bin/env node

/**
 * Standalone Remotion render script.
 * Runs in a separate Node process so Turbopack never touches Remotion.
 *
 * Usage:
 *   node scripts/render-video.mjs '{"eventTitle":"...","photos":[...],...}'
 *
 * Outputs JSON on stdout: { "outputPath": "/videos/recap_xxx.mp4" }
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const FRAMES_PER_SLIDE = 90;
const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 90;

async function main() {
  const inputJson = process.argv[2];
  if (!inputJson) {
    console.error("Usage: node scripts/render-video.mjs '<json>'");
    process.exit(1);
  }

  const input = JSON.parse(inputJson);
  const { eventId, eventTitle, eventCity, eventDate, photos, participants, wrappedStats } = input;

  // The composition groups photos into grid slides of up to 4
  const WRAPPED_SLIDE_COUNT = wrappedStats ? 3 : 0;
  const WRAPPED_FRAMES = 120;
  const gridSlideCount = Math.max(1, Math.ceil(photos.length / 4));
  const totalFrames = INTRO_FRAMES + gridSlideCount * FRAMES_PER_SLIDE + WRAPPED_SLIDE_COUNT * WRAPPED_FRAMES + OUTRO_FRAMES;

  const entryPoint = path.join(projectRoot, "remotion", "index.tsx");

  console.error("Bundling Remotion composition...");
  const bundleLocation = await bundle({ entryPoint });

  const inputProps = {
    eventTitle,
    eventCity,
    eventDate,
    photos,
    participants,
    wrappedStats,
  };

  console.error("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "EventRecap",
    inputProps,
  });

  composition.durationInFrames = totalFrames;

  const videosDir = path.join(projectRoot, "public", "videos");
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputFileName = `recap_${eventId}_${timestamp}.mp4`;
  const outputLocation = path.join(videosDir, outputFileName);

  console.error(`Rendering video to ${outputLocation}...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  console.error("Done!");

  // Output JSON on stdout for the API to read
  const result = { outputPath: `/videos/${outputFileName}` };
  process.stdout.write(JSON.stringify(result));
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
