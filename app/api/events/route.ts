import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/models/Event";
import { buildCorsHeaders } from "@/lib/cors";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

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

function generateJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureSeedEvents();
    const userId = await resolveUserId(request);
    const scope = new URL(request.url).searchParams.get("scope") ?? "joined";

    const filter =
      scope === "all"
        ? {
            $or: [{ type: "public" }, { createdBy: userId }, { members: userId }]
          }
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
            maxPeople: event.maxPeople,
            startTime: event.startTime ? new Date(event.startTime).toISOString() : undefined,
            prompts: event.prompts ?? [],
            joinCode: (event.type === "private" && String(event.createdBy) === userId) ? event.joinCode : undefined,
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

    const isPrivate = body.type === "private";
    const joinCode = isPrivate ? generateJoinCode() : undefined;
    
    // Enforce max 4 people
    const maxPeople = Math.min(body.maxPeople ? parseInt(body.maxPeople, 10) : 4, 4);
    
    // Handle prompts padding
    let initialPrompts = body.prompts ?? [];
    if (initialPrompts.length === 0) {
      initialPrompts = ["Take a selfie", "Show your current view"];
    }

    let finalPrompts = [...initialPrompts];

    if (finalPrompts.length < 12) {
      try {
        const numToGenerate = 12 - finalPrompts.length;
        const promptString = finalPrompts.join(", ");
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Generate ${numToGenerate} short, fun, engaging photo prompts for a social event. They should match the vibe of these existing prompts: [${promptString}]. Only return the prompts separated by the pipe character '|' with no numbers, bullet points, or extra text. Example: Find a dog|Take a picture of the sky|Show your shoes`
        });

        if (response.text) {
          const generated = response.text.split('|').map(p => p.trim()).filter(Boolean);
          finalPrompts = [...finalPrompts, ...generated].slice(0, 12);
        }
      } catch (aiError) {
        console.error("Failed to generate additional prompts:", aiError);
        // non-fatal, just proceed with whatever prompts we have
      }
    }

    const created = await Event.create({
      title: body.title,
      type: body.type ?? "public",
      city: body.city ?? "",
      intervalMinutes: body.intervalMinutes ?? 60,
      maxPeople: maxPeople,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      prompts: finalPrompts,
      joinCode,
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
          maxPeople: created.maxPeople,
          startTime: created.startTime ? new Date(created.startTime).toISOString() : undefined,
          prompts: created.prompts ?? [],
          joinCode: created.joinCode,
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
