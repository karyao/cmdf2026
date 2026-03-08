import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { Event } from "@/lib/models/Event";
import { Video } from "@/lib/models/Video";
import { User } from "@/lib/models/User";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";

const FRAMES_PER_PHOTO = 90;
const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 90;
const FPS = 30;
const DEFAULT_SAMPLE_MEMBER_IMAGES = [
  "/images/IMG_1450.jpeg",
  "/images/IMG_1240.jpeg",
  "/images/IMG_1485.jpeg",
  "/images/IMG_0555.jpeg",
  "/images/IMG_0559.jpeg",
  "/images/IMG_0565.jpeg",
  "/images/IMG_0540.jpeg",
  "/images/IMG_1644.jpeg",
  "/images/IMG_1501.jpeg",
  "/images/IMG_1235.jpeg"
];
const DUMMY_MEMBER_NAMES = ["Alex", "Jordan", "Morgan", "Taylor", "Megan", "Noah"];
const FORCED_SAMPLE_NAMES = ["Jordan", "Megan"];
const DEMO_EVENT_TITLE = "Midnight Moodboard Club";
const MIN_DEMO_SLIDES = 10;

async function getPublicImagePool() {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");
    const files = await fs.readdir(imagesDir);
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const imagePaths = files
      .filter((file) => allowedExt.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `/images/${file}`);

    return imagePaths.length ? imagePaths : DEFAULT_SAMPLE_MEMBER_IMAGES;
  } catch {
    return DEFAULT_SAMPLE_MEMBER_IMAGES;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, userId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch event info and its members
    const event = await Event.findById(eventId).populate("members").lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const allMembers = ((event as any).members || []).map((m: any) => ({
      _id: String(m._id),
      name: String(m._id) === String(userId || "000000000000000000000001") ? "You" : (m.name || "Member")
    }));

    // Fetch all photos for this event and populate user info for real names
    const photos = await Media.find({ event_id: eventId, media_type: "photo" })
      .populate("user_id", "name")
      .sort({ timestamp: 1 })
      .lean();

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found for this event" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const eventTitle = (event as any).title || "";
    const sampleMemberImages =
      eventTitle === DEMO_EVENT_TITLE ? await getPublicImagePool() : DEFAULT_SAMPLE_MEMBER_IMAGES;

    const requestingUserId = String(userId || "000000000000000000000001");
    const memberIds = ((event as any).members ?? []).map((m: any) => String(m));
    const participantNameById = new Map<string, string>();
    let dummyCursor = 0;
    for (const id of memberIds) {
      if (id === requestingUserId) {
        participantNameById.set(id, "You");
      } else {
        participantNameById.set(id, DUMMY_MEMBER_NAMES[dummyCursor % DUMMY_MEMBER_NAMES.length]);
        dummyCursor += 1;
      }
    }

    const photoSlides = photos.map((p: any) => {
      let url = p.media_url;
      if (url.startsWith("/")) url = `${baseUrl}${url}`;
      const ownerId = p.user_id ? String(p.user_id?._id || p.user_id) : "";
      return {
        url,
        participantId: ownerId,
        participantName: participantNameById.get(ownerId) ?? (ownerId === requestingUserId ? "You" : (p.user_id?.name || "Member")),
        timestamp: p.timestamp?.toISOString?.() ?? new Date(p.timestamp).toISOString(),
        width: p.width,
        height: p.height,
      };
    });
    const participants = memberIds.length
      ? memberIds.map((id: string) => participantNameById.get(id) ?? "Member")
      : [...new Set(photos.map((p: any) => String(p.user_id?._id || p.user_id)))].map((id: string) =>
          id === requestingUserId ? "You" : "Member"
        );

    // If event members have not uploaded yet, add sample photos so recap shows everyone.
    const existingPhotoOwnerIds = new Set(photos.map((p: any) => String(p.user_id?._id || p.user_id)));
    let sampleIdx = 0;
    const baseTimestampMs = photos.length
      ? new Date((photos as any[])[photos.length - 1].timestamp).getTime()
      : new Date((event as any).createdAt ?? Date.now()).getTime();

    for (const memberId of memberIds) {
      if (existingPhotoOwnerIds.has(memberId)) continue;
      const samplePath = sampleMemberImages[sampleIdx % sampleMemberImages.length];
      sampleIdx += 1;
      photoSlides.push({
        url: `${baseUrl}${samplePath}`,
        participantId: memberId,
        participantName: participantNameById.get(memberId) ?? "Member",
        timestamp: new Date(baseTimestampMs + sampleIdx * 60_000).toISOString(),
        width: null,
        height: null
      });
    }

    // Force recap head to include You + 2 local sample images from public/images.
    // This guarantees a visible 3-person first grid regardless of upload mix.
    const baseTs = photos.length
      ? new Date((photos as any[])[photos.length - 1].timestamp).getTime()
      : new Date((event as any).createdAt ?? Date.now()).getTime();
    const forcedSampleSlides = FORCED_SAMPLE_NAMES.map((name, idx) => {
      const samplePath = sampleMemberImages[(sampleIdx + idx) % sampleMemberImages.length];
      return {
        url: `${baseUrl}${samplePath}`,
        participantId: `dummy-${idx}`,
        participantName: name,
        timestamp: new Date(baseTs + (idx + 1) * 90_000).toISOString(),
        width: null,
        height: null
      };
    });
    sampleIdx += forcedSampleSlides.length;
    photoSlides.push(...forcedSampleSlides);

    // For the demo event, append the full public/images pool so recap feels rich.
    // This keeps real captured photos and adds all pool images after them.
    if (eventTitle === DEMO_EVENT_TITLE) {
      const existingUrls = new Set(photoSlides.map((slide) => slide.url));
      const demoPoolSlides = sampleMemberImages
        .map((samplePath, idx) => {
          const slideUrl = `${baseUrl}${samplePath}`;
          return {
            url: slideUrl,
            participantId: idx % 4 === 0 ? requestingUserId : `demo-pool-${idx}`,
            participantName:
              idx % 4 === 0
                ? "You"
                : DUMMY_MEMBER_NAMES[idx % DUMMY_MEMBER_NAMES.length],
            timestamp: new Date(baseTs + (idx + 1) * 45_000).toISOString(),
            width: null,
            height: null
          };
        })
        .filter((slide) => !existingUrls.has(slide.url));

      photoSlides.push(...demoPoolSlides);
    }

    const firstUserSlide = photoSlides.find((slide) => slide.participantName === "You") ?? photoSlides[0];
    const preferredHead = [firstUserSlide, ...forcedSampleSlides].filter(Boolean);

    const seenKeys = new Set<string>();
    const dedupeKey = (slide: any) => `${slide.participantName}|${slide.url}|${slide.timestamp}`;
    const orderedPhotoSlides: typeof photoSlides = [];
    for (const slide of preferredHead) {
      const key = dedupeKey(slide);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      orderedPhotoSlides.push(slide);
    }
    for (const slide of photoSlides) {
      const key = dedupeKey(slide);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      orderedPhotoSlides.push(slide);
    }

    // Ensure demo recaps have enough volume for consistent presentations.
    if (eventTitle === DEMO_EVENT_TITLE && orderedPhotoSlides.length < MIN_DEMO_SLIDES) {
      const basePadTs = orderedPhotoSlides.length
        ? new Date(orderedPhotoSlides[orderedPhotoSlides.length - 1].timestamp).getTime()
        : baseTs;
      let padIdx = 0;
      while (orderedPhotoSlides.length < MIN_DEMO_SLIDES) {
        const samplePath = sampleMemberImages[padIdx % sampleMemberImages.length];
        orderedPhotoSlides.push({
          url: `${baseUrl}${samplePath}`,
          participantId: padIdx % 3 === 0 ? requestingUserId : `demo-pad-${padIdx}`,
          participantName: padIdx % 3 === 0 ? "You" : DUMMY_MEMBER_NAMES[padIdx % DUMMY_MEMBER_NAMES.length],
          timestamp: new Date(basePadTs + (padIdx + 1) * 30_000).toISOString(),
          width: null,
          height: null
        });
        padIdx += 1;
      }
    }

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
    // Group photos by hour to determine grid slide count
    const hourGroups: Record<string, number> = {};
    for (const p of orderedPhotoSlides) {
      if (!p) continue;
      const d = new Date(p.timestamp);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      hourGroups[k] = (hourGroups[k] || 0) + 1;
    }
    const numActiveHours = Object.keys(hourGroups).length;
    const membersCount = allMembers?.length || 1;
    const slidesPerHour = Math.ceil(membersCount / 4);
    
    let gridSlideCount = numActiveHours * slidesPerHour;
    gridSlideCount = Math.max(1, gridSlideCount);
    const totalFrames = INTRO_FRAMES + gridSlideCount * FRAMES_PER_PHOTO + WRAPPED_SLIDE_COUNT * WRAPPED_FRAMES_PER + OUTRO_FRAMES;
    const durationSeconds = totalFrames / FPS;

    // Build input for the render script
    const scriptInput = JSON.stringify({
      eventId,
      eventTitle: (event as any).title,
      eventCity,
      eventDate: (event as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      photos: orderedPhotoSlides,
      participants,
      allMembers,
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

    // Remotion may print progress logs to stdout. Extract the JSON payload line safely.
    let outputPath = "";
    try {
      outputPath = JSON.parse(result).outputPath;
    } catch {
      const lines = result
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .reverse();

      for (const line of lines) {
        if (!line.startsWith("{") || !line.endsWith("}")) continue;
        try {
          const parsed = JSON.parse(line);
          if (typeof parsed.outputPath === "string") {
            outputPath = parsed.outputPath;
            break;
          }
        } catch {
          // Keep scanning.
        }
      }
    }

    if (!outputPath) {
      throw new Error(`Render finished but output JSON could not be parsed: ${result.slice(0, 300)}`);
    }

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
