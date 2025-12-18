import { NextRequest, NextResponse } from "next/server";
import { getAllProfiles, saveProfile } from "@/lib/profiles";

export async function GET() {
  try {
    const profiles = getAllProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to get profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id || !name || !color) {
      return NextResponse.json(
        { error: "Missing required fields (id, name, color)" },
        { status: 400 }
      );
    }

    const profile = saveProfile({
      id,
      name,
      color,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
