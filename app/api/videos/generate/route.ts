import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { Event } from "@/lib/models/Event";
import { Video } from "@/lib/models/Video";
import { execFile } from "child_process";
import path from "path";

const FRAMES_PER_PHOTO = 90;
const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 90;
const FPS = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch event info
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch all photos for this event
    const photos = await Media.find({ event_id: eventId, media_type: "photo" })
      .sort({ timestamp: 1 })
      .lean();

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found for this event" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const photoSlides = photos.map((p: any) => {
      let url = p.media_url;
      if (url.startsWith("/")) url = `${baseUrl}${url}`;
      return {
        url,
        participantName: p.user_id === (userId || "000000000000000000000001") ? "You" : "Member",
        timestamp: p.timestamp?.toISOString?.() ?? new Date(p.timestamp).toISOString(),
        width: p.width,
        height: p.height,
      };
    });

    const participants = [...new Set(photos.map((p: any) => String(p.user_id)))].map(
      (id) => (id === (userId || "000000000000000000000001") ? "You" : "Member")
    );

    // Compute Wrapped stats
    // 1. Photo Streak — consecutive photos without missing
    const photoStreak = photos.length; // All photos in event = streak

    // 2. Most On Time — find fastest response time (smallest gap between photos)
    let fastestMs = Infinity;
    for (let i = 1; i < photos.length; i++) {
      const prev = new Date((photos as any)[i - 1].timestamp).getTime();
      const curr = new Date((photos as any)[i].timestamp).getTime();
      const gap = Math.abs(curr - prev);
      if (gap > 0 && gap < fastestMs) fastestMs = gap;
    }
    let mostOnTime = "Instant ⚡";
    if (fastestMs < Infinity) {
      const secs = Math.floor(fastestMs / 1000);
      if (secs < 60) mostOnTime = `${secs} seconds`;
      else if (secs < 3600) mostOnTime = `${Math.floor(secs / 60)} minutes`;
      else mostOnTime = `${Math.floor(secs / 3600)} hours`;
    }

    // 3. Most Active City — from event data
    const eventCity = (event as any).city || "Vancouver";

    // Count all user events for city stats
    const allEvents = await Event.find({ members: userId || "000000000000000000000001" }).lean();
    const cityMap: Record<string, number> = {};
    for (const e of allEvents as any[]) {
      const c = e.city || "Vancouver";
      cityMap[c] = (cityMap[c] || 0) + 1;
    }
    const mostActiveCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || eventCity;
    const citiesVisited = Object.keys(cityMap).length;

    const wrappedStats = {
      photoStreak,
      totalPhotos: photos.length,
      mostOnTime,
      mostActiveCity,
      citiesVisited,
    };

    const WRAPPED_SLIDE_COUNT = 3;
    const WRAPPED_FRAMES_PER = 120;
    const gridSlideCount = Math.max(1, Math.ceil(photoSlides.length / 4));
    const totalFrames = INTRO_FRAMES + gridSlideCount * FRAMES_PER_PHOTO + WRAPPED_SLIDE_COUNT * WRAPPED_FRAMES_PER + OUTRO_FRAMES;
    const durationSeconds = totalFrames / FPS;

    // Build input for the render script
    const scriptInput = JSON.stringify({
      eventId,
      eventTitle: (event as any).title,
      eventCity,
      eventDate: (event as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      photos: photoSlides,
      participants,
      wrappedStats,
    });

    // Spawn the render script in a separate Node process
    const scriptPath = path.join(process.cwd(), "scripts", "render-video.mjs");

    const result = await new Promise<string>((resolve, reject) => {
      execFile("node", [scriptPath, scriptInput], {
        cwd: process.cwd(),
        timeout: 120_000, // 2 minute timeout
        maxBuffer: 10 * 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (stderr) console.error("[render-video]", stderr);
        if (error) return reject(new Error(stderr || error.message));
        resolve(stdout.trim());
      });
    });

    const { outputPath } = JSON.parse(result);
    const videoUrl = outputPath;

    // Save to database
    const videoRecord = await Video.create({
      event_id: eventId,
      user_id: userId || "000000000000000000000001",
      video_url: videoUrl,
      title: `${(event as any).title} Recap`,
      duration_seconds: Math.round(durationSeconds),
      photo_count: photos.length,
      participants,
      event_title: (event as any).title,
      event_city: (event as any).city || "Vancouver",
    });

    return NextResponse.json({
      video: {
        _id: String(videoRecord._id),
        video_url: `${baseUrl}${videoUrl}`,
        title: videoRecord.title,
        duration_seconds: videoRecord.duration_seconds,
        photo_count: videoRecord.photo_count,
        event_title: videoRecord.event_title,
        event_city: videoRecord.event_city,
        createdAt: videoRecord.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/videos/generate failed:", error);
    return NextResponse.json(
      { error: "Failed to generate video", details: String(error) },
      { status: 500 }
    );
  }
}
