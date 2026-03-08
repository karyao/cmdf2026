import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/Event";
import { buildCorsHeaders } from "@/lib/cors";

const DEMO_USER_OBJECT_ID = process.env.DEMO_USER_ID ?? "000000000000000000000001";
const ALT_DEMO_USER_OBJECT_ID = "000000000000000000000002";

async function ensureSeedEvents() {
  const seeds = [
    {
      title: "Sunset Photo Walk",
      city: "Vancouver",
      intervalMinutes: 180,
      createdBy: DEMO_USER_OBJECT_ID,
      members: [DEMO_USER_OBJECT_ID]
    },
    {
      title: "Study Friends Downtown",
      city: "Vancouver",
      intervalMinutes: 60,
      createdBy: ALT_DEMO_USER_OBJECT_ID,
      members: [ALT_DEMO_USER_OBJECT_ID]
    },
    {
      title: "4-Person Focus Group",
      city: "Burnaby",
      intervalMinutes: 45,
      createdBy: DEMO_USER_OBJECT_ID,
      members: [
        DEMO_USER_OBJECT_ID, 
        "000000000000000000000003", 
        "000000000000000000000004", 
        "000000000000000000000005"
      ]
    },
    {
      title: "Morning Coffee Duo",
      city: "Richmond",
      intervalMinutes: 120,
      createdBy: DEMO_USER_OBJECT_ID,
      members: [DEMO_USER_OBJECT_ID, "000000000000000000000006"]
    },
    {
      title: "Hiking Trio",
      city: "North Vancouver",
      intervalMinutes: 240,
      createdBy: DEMO_USER_OBJECT_ID,
      members: [DEMO_USER_OBJECT_ID, "000000000000000000000007", "000000000000000000000008"]
    }
  ];

  await Promise.all(
    seeds.map((seed) =>
      Event.updateOne(
        { title: seed.title, city: seed.city, intervalMinutes: seed.intervalMinutes, type: "public" },
        {
          $setOnInsert: {
            title: seed.title,
            city: seed.city,
            intervalMinutes: seed.intervalMinutes,
            type: "public",
            createdBy: seed.createdBy,
            members: seed.members
          }
        },
        { upsert: true }
      )
    )
  );
}

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

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureSeedEvents();
    const userId = await resolveUserId(request);
    const scope = new URL(request.url).searchParams.get("scope") ?? "joined";

    const filter =
      scope === "all"
        ? { type: "public" }
        : {
            $or: [{ createdBy: userId }, { members: userId }]
          };

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        events: events.map((event: any) => {
          const members = (event.members ?? []).map(String);
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
        })
      },
      { headers: buildCorsHeaders(request) }
    );
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500, headers: buildCorsHeaders(request) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await resolveUserId(request, body.userId);

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
          memberCount: created.members.length,
          joined: true,
          createdAt: new Date(created.createdAt).toISOString()
        }
      },
      { status: 201, headers: buildCorsHeaders(request) }
    );
  } catch (error) {
    console.error("POST /api/events failed", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500, headers: buildCorsHeaders(request) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}
