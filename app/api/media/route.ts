import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Media } from "@/lib/models/Media";

/**
 * Uploads a base64 image to Cloudinary.
 * Only called when useCloud: true is passed in the request.
 */
async function uploadToCloudinary(imageData: string) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });

  return cloudinary.uploader.upload(imageData, {
    folder: "day-in-the-life",
    resource_type: "image"
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const mediaType = searchParams.get("type");

    const filter: Record<string, unknown> = {};
    if (eventId) {
      if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
        return NextResponse.json({ error: "Invalid eventId format" }, { status: 400 });
      }
      filter.event_id = eventId;
    }
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

    let mediaUrl = body.media_url ?? "";
    let thumbnailUrl = body.thumbnail_url ?? "";
    let cloudinaryPublicId = body.cloudinary_public_id ?? "";
    let mimeType = body.mime_type ?? "";
    let width = body.width ?? null;
    let height = body.height ?? null;
    let mediaType = body.media_type ?? "photo";

    // Handle base64 image from camera capture
    // Handle base64 image from camera capture
    if (body.imageData) {
      const isDataUri = body.imageData.startsWith("data:image");
      // Basic check: should be a data URI or a long continuous string (raw base64)
      if (!isDataUri && body.imageData.length < 100) {
        return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
      }

      // Local-first: save to public/uploads by default
      if (body.useCloud) {
        // Cloudinary requires the data: URI prefix, so add it if it's missing
        const uploadData = isDataUri ? body.imageData : `data:image/jpeg;base64,${body.imageData}`;
        const uploaded = await uploadToCloudinary(uploadData);
        if (uploaded) {
          mediaUrl = uploaded.secure_url;
          thumbnailUrl = uploaded.secure_url.replace("/upload/", "/upload/w_400,c_scale/");
          cloudinaryPublicId = uploaded.public_id;
          mimeType = `image/${uploaded.format}`;
          width = uploaded.width;
          height = uploaded.height;
        } else {
          mediaUrl = body.imageData;
          mimeType = "image/jpeg";
        }
      } else {
        // Default: save actual physical file to public/uploads
        try {
          // Robust decoding: some payloads arrive with double prefixes like
          // "data:image/jpeg;base64,data:image/png;base64,..."
          // We find the LAST "base64," to find the start of the real pixel data.
          const lastBase64Index = body.imageData.lastIndexOf("base64,");
          const base64Data = lastBase64Index !== -1 
            ? body.imageData.substring(lastBase64Index + 7) 
            : body.imageData;
            
          const buffer = Buffer.from(base64Data, "base64");
          
          const fs = await import("fs/promises");
          const path = await import("path");
          
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          // Ensure directory exists
          await fs.mkdir(uploadsDir, { recursive: true });
          
          const filename = `capture_${Date.now()}.jpg`;
          const filepath = path.join(uploadsDir, filename);
          
          await fs.writeFile(filepath, buffer);
          
          // The public URL starts at the root /
          mediaUrl = `/uploads/${filename}`;
          mimeType = "image/jpeg";
        } catch (fileErr) {
          console.error("Failed to save physical file:", fileErr);
          // Fallback to data URL if disk write fails
          mediaUrl = body.imageData;
          mimeType = "image/jpeg";
        }
      }
      mediaType = "photo";
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Provide either imageData (base64) or media_url" },
        { status: 400 }
      );
    }

    if (body.media_type && !["photo", "video"].includes(body.media_type)) {
      return NextResponse.json(
        { error: "media_type must be 'photo' or 'video'" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Use authenticated user if session exists
    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = (session.user as any).id ?? null;
    }

    const created = await Media.create({
      media_url: mediaUrl,
      media_type: mediaType,
      thumbnail_url: thumbnailUrl,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      user_id: userId,
      event_id: body.event_id ?? null,
      prompt: body.prompt ?? "",
      slot_id: body.slot_id ?? "",
      width,
      height,
      duration_seconds: body.duration_seconds ?? null,
      file_size_bytes: body.file_size_bytes ?? null,
      mime_type: mimeType,
      location: body.location ?? { lat: null, lng: null },
      caption: body.caption ?? "",
      is_private: body.is_private ?? false,
      cloudinary_public_id: cloudinaryPublicId
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
