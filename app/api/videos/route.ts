import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Video } from "@/lib/models/Video";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const eventId = searchParams.get("eventId");

    const filter: Record<string, unknown> = {};
    if (userId) filter.user_id = userId;
    if (eventId) filter.event_id = eventId;

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const formatted = videos.map((v: any) => ({
      _id: String(v._id),
      video_url: v.video_url.startsWith("/") ? `${baseUrl}${v.video_url}` : v.video_url,
      title: v.title,
      duration_seconds: v.duration_seconds,
      photo_count: v.photo_count,
      participants: v.participants,
      event_title: v.event_title,
      event_city: v.event_city,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({ videos: formatted });
  } catch (error) {
    console.error("GET /api/videos failed:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const deleted = await Video.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/videos failed:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
