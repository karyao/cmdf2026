import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/Event";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;

    // Return events where user is the creator or a member
    const events = await Event.find({
      $or: [{ createdBy: userId }, { members: userId }]
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      events: events.map((event: any) => ({
        _id: String(event._id),
        title: event.title,
        type: event.type,
        city: event.city,
        intervalMinutes: event.intervalMinutes,
        createdBy: String(event.createdBy),
        members: event.members.map(String),
        createdAt: new Date(event.createdAt).toISOString()
      }))
    });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const created = await Event.create({
      title: body.title,
      type: body.type ?? "public",
      city: body.city ?? "",
      intervalMinutes: body.intervalMinutes ?? 60,
      createdBy: userId,
      members: [userId] // creator is automatically a member
    });

    return NextResponse.json(
      {
        event: {
          _id: String(created._id),
          title: created.title,
          type: created.type,
          city: created.city,
          intervalMinutes: created.intervalMinutes,
          createdBy: String(created.createdBy),
          members: created.members.map(String),
          createdAt: new Date(created.createdAt).toISOString()
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/events failed", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
