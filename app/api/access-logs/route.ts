import { NextRequest, NextResponse } from "next/server";
import {
  getAccessLogs,
  getAccessLogsCount,
  getRecentAccessSummary,
  ActionType,
} from "@/lib/access-logs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if summary is requested
    if (searchParams.get("summary") === "true") {
      const summary = getRecentAccessSummary();
      return NextResponse.json(summary);
    }

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as ActionType | undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const logs = getAccessLogs({
      limit,
      offset,
      userId,
      action,
      startDate,
      endDate,
    });

    const total = getAccessLogsCount({
      userId,
      action,
      startDate,
      endDate,
    });

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to get access logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch access logs" },
      { status: 500 }
    );
  }
}
