import { NextRequest, NextResponse } from "next/server";
import { getAllProfiles, saveProfile } from "@/lib/profiles";
import { logAccess } from "@/lib/access-logs";

function getClientInfo(request: NextRequest) {
  const ipAddress =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;
  return { ipAddress, userAgent };
}

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

    // Log profile update
    const { ipAddress, userAgent } = getClientInfo(request);
    logAccess({
      userId: id,
      userName: name,
      action: "profile_update",
      detail: `color: ${color}`,
      ipAddress,
      userAgent,
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
