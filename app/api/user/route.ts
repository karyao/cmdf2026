import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

// GET /api/user?userId=... — fetch user profile
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let user = await User.findById(userId).lean();

    // If user doesn't exist yet (demo user), create a default profile
    if (!user) {
      user = await User.create({
        _id: userId,
        name: "Camille Yao",
        email: "camille@demo.com",
        image: "",
        provider: "demo",
        providerId: userId,
      });
      user = user.toObject();
    }

    return NextResponse.json({
      user: {
        _id: String((user as any)._id),
        name: (user as any).name,
        email: (user as any).email,
        image: (user as any).image,
        bio: (user as any).bio || "",
      },
    });
  } catch (error) {
    console.error("GET /api/user failed:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT /api/user — update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { userId, name, bio } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const update: Record<string, string> = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    return NextResponse.json({
      user: {
        _id: String((user as any)._id),
        name: (user as any).name,
        email: (user as any).email,
        image: (user as any).image,
        bio: (user as any).bio || "",
      },
    });
  } catch (error) {
    console.error("PUT /api/user failed:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
