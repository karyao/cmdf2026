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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await resolveUserId(request, body.userId);

    if (!body.joinCode) {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 });
    }

    const joinCode = body.joinCode.toUpperCase().trim();

    await connectToDatabase();

    const event = await Event.findOne({ joinCode, type: "private" });
    
    if (!event) {
      return NextResponse.json({ error: "Invalid or expired join code" }, { status: 404 });
    }

    // Check if already a member
    const members = event.members.map(String);
    if (members.includes(userId)) {
      return NextResponse.json({ message: "Already joined" }, { status: 200, headers: buildCorsHeaders(request) });
    }

    // Check capacity
    const maxPeople = event.maxPeople || 10;
    if (members.length >= maxPeople) {
      return NextResponse.json({ error: "Event is full" }, { status: 403 });
    }

    // Join
    event.members.push(userId);
    await event.save();

    return NextResponse.json(
      { success: true },
      { status: 200, headers: buildCorsHeaders(request) }
    );
  } catch (error) {
    console.error("POST /api/events/join-code failed", error);
    return NextResponse.json({ error: "Failed to join event" }, { status: 500, headers: buildCorsHeaders(request) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}
