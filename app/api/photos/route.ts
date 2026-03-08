import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { Photo } from "@/lib/models/Photo";
import { CreatePhotoInput } from "@/lib/types";

export async function GET() {
  try {
    await connectToDatabase();
    const photos = await Photo.find().sort({ timestamp: -1 }).limit(60).lean();

    return NextResponse.json({
      photos: photos.map((photo: any) => ({
        _id: String(photo._id),
        image_url: photo.image_url,
        timestamp: new Date(photo.timestamp).toISOString(),
        prompt: photo.prompt,
        user_id: photo.user_id ? String(photo.user_id) : undefined,
        event_id: photo.event_id ? String(photo.event_id) : undefined
      }))
    });
  } catch (error) {
    console.error("GET /api/photos failed", error);
    return NextResponse.json({ error: "Failed to load photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePhotoInput;

    if (!body.imageData || !body.imageData.startsWith("data:image")) {
      return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
    }

    await connectToDatabase();

    // Use authenticated user if available, otherwise fall back to null (guest)
    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = (session.user as any).id ?? null;
    }

    const uploaded = await cloudinary.uploader.upload(body.imageData, {
      folder: "day-in-the-life",
      resource_type: "image"
    });

    const created = await Photo.create({
      image_url: uploaded.secure_url,
      timestamp: new Date(),
      prompt: body.prompt ?? "",
      user_id: userId,
      event_id: body.eventId ?? null
    });

    return NextResponse.json(
      {
        photo: {
          _id: String(created._id),
          image_url: created.image_url,
          timestamp: new Date(created.timestamp).toISOString(),
          prompt: created.prompt,
          user_id: created.user_id ? String(created.user_id) : undefined,
          event_id: created.event_id ? String(created.event_id) : undefined
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/photos failed", error);
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
  }
}
