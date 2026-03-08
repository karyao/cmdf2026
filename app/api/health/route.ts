import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Event } from "@/lib/models/Event";
import { Photo } from "@/lib/models/Photo";
import { Media } from "@/lib/models/Media";

export async function GET() {
  try {
    const conn = await connectToDatabase();

    // Get collection counts to verify the connection works
    const [userCount, eventCount, photoCount, mediaCount] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Photo.countDocuments(),
      Media.countDocuments()
    ]);

    return NextResponse.json({
      status: "ok",
      database: conn.connection.name,
      host: conn.connection.host,
      collections: {
        users: userCount,
        events: eventCount,
        photos: photoCount,
        media: mediaCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message ?? "Unknown error"
      },
      { status: 500 }
    );
  }
}
