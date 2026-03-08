import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/Event";
import { buildCorsHeaders } from "@/lib/cors";

const DEMO_USER_OBJECT_ID = process.env.DEMO_USER_ID ?? "000000000000000000000001";

function toUserId(candidate?: string | null) {
  if (candidate && /^[0-9a-fA-F]{24}$/.test(candidate)) {
    return candidate;
  }
  return DEMO_USER_OBJECT_ID;
}

async function resolveUserId(request: NextRequest, bodyUserId?: string) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return (session.user as any).id as string;
  }

  const searchParams = new URL(request.url).searchParams;
  const fromQuery = searchParams.get("userId");
  const fromHeader = request.headers.get("x-user-id");
  return toUserId(bodyUserId ?? fromQuery ?? fromHeader);
}

function mapEvent(event: any, userId: string) {
  const members = event.members.map(String);
  return {
    _id: String(event._id),
    title: event.title,
    type: event.type,
    city: event.city,
    intervalMinutes: event.intervalMinutes,
    createdBy: String(event.createdBy),
    members,
    memberCount: members.length,
    joined: members.includes(userId),
    createdAt: new Date(event.createdAt).toISOString()
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(request, body.userId);
    const { eventId } = await context.params;

    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid eventId format" }, { status: 400, headers: buildCorsHeaders(request) });
    }

    await connectToDatabase();

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { members: userId } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404, headers: buildCorsHeaders(request) });
    }

    return NextResponse.json({ event: mapEvent(updated, userId) }, { headers: buildCorsHeaders(request) });
  } catch (error) {
    console.error("POST /api/events/[eventId]/membership failed", error);
    return NextResponse.json({ error: "Failed to join event" }, { status: 500, headers: buildCorsHeaders(request) });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = await resolveUserId(request, body.userId);
    const { eventId } = await context.params;

    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid eventId format" }, { status: 400, headers: buildCorsHeaders(request) });
    }

    await connectToDatabase();

    const existing = await Event.findById(eventId).lean();
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404, headers: buildCorsHeaders(request) });
    }

    if (String(existing.createdBy) === userId) {
      return NextResponse.json(
        { error: "Event creator cannot leave their own event" },
        { status: 400, headers: buildCorsHeaders(request) }
      );
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { $pull: { members: userId } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Event not found after update" }, { status: 404, headers: buildCorsHeaders(request) });
    }

    return NextResponse.json({ event: mapEvent(updated, userId) }, { headers: buildCorsHeaders(request) });
  } catch (error) {
    console.error("DELETE /api/events/[eventId]/membership failed", error);
    return NextResponse.json({ error: "Failed to leave event" }, { status: 500, headers: buildCorsHeaders(request) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}
