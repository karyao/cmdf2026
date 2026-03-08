import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/lib/models/Media";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const mediaType = searchParams.get("type"); // "photo" | "video"

    const filter: any = {};
    if (eventId) filter.event_id = eventId;
    if (mediaType) filter.media_type = mediaType;

    const media = await Media.find(filter)
      .sort({ timestamp: -1 })
      .limit(60)
      .lean();

    return NextResponse.json({
      media: media.map((item: any) => ({
        _id: String(item._id),
        media_url: item.media_url,
        media_type: item.media_type,
        thumbnail_url: item.thumbnail_url,
        timestamp: new Date(item.timestamp).toISOString(),
        user_id: item.user_id ? String(item.user_id) : null,
        event_id: item.event_id ? String(item.event_id) : null,
        prompt: item.prompt,
        slot_id: item.slot_id,
        width: item.width,
        height: item.height,
        duration_seconds: item.duration_seconds,
        mime_type: item.mime_type,
        caption: item.caption,
        is_private: item.is_private,
        location: item.location
      }))
    });
  } catch (error) {
    console.error("GET /api/media failed", error);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.media_url) {
      return NextResponse.json({ error: "media_url is required" }, { status: 400 });
    }
    if (!body.media_type || !["photo", "video"].includes(body.media_type)) {
      return NextResponse.json({ error: "media_type must be 'photo' or 'video'" }, { status: 400 });
    }

    await connectToDatabase();

    // Use authenticated user if available
    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = (session.user as any).id ?? null;
    }

    const created = await Media.create({
      media_url: body.media_url,
      media_type: body.media_type,
      thumbnail_url: body.thumbnail_url ?? "",
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      user_id: userId,
      event_id: body.event_id ?? null,
      prompt: body.prompt ?? "",
      slot_id: body.slot_id ?? "",
      width: body.width ?? null,
      height: body.height ?? null,
      duration_seconds: body.duration_seconds ?? null,
      file_size_bytes: body.file_size_bytes ?? null,
      mime_type: body.mime_type ?? "",
      location: body.location ?? { lat: null, lng: null },
      caption: body.caption ?? "",
      is_private: body.is_private ?? false,
      cloudinary_public_id: body.cloudinary_public_id ?? ""
    });

    return NextResponse.json(
      {
        media: {
          _id: String(created._id),
          media_url: created.media_url,
          media_type: created.media_type,
          thumbnail_url: created.thumbnail_url,
          timestamp: new Date(created.timestamp).toISOString(),
          user_id: created.user_id ? String(created.user_id) : null,
          event_id: created.event_id ? String(created.event_id) : null,
          prompt: created.prompt,
          caption: created.caption,
          is_private: created.is_private
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/media failed", error);
    return NextResponse.json({ error: "Failed to save media" }, { status: 500 });
  }
}
