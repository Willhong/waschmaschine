import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient } from "@/lib/reservations";
import { logAccess } from "@/lib/access-logs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientInfo(request: NextRequest) {
  // Debug: 전체 헤더 확인
  console.log("=== IP Headers Debug ===");
  console.log("x-forwarded-for:", request.headers.get("x-forwarded-for"));
  console.log("x-real-ip:", request.headers.get("x-real-ip"));
  console.log("cf-connecting-ip:", request.headers.get("cf-connecting-ip"));
  console.log("true-client-ip:", request.headers.get("true-client-ip"));
  console.log("========================");

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;
  return { ipAddress, userAgent };
}

export async function GET(request: NextRequest) {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { ipAddress, userAgent } = getClientInfo(request);

  // Log SSE connection
  logAccess({
    action: "sse_connect",
    detail: `clientId: ${clientId}`,
    ipAddress,
    userAgent,
  });

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`)
      );

      // Register this client
      addSSEClient(clientId, controller);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
          );
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        removeSSEClient(clientId);
        // Log SSE disconnection
        logAccess({
          action: "sse_disconnect",
          detail: `clientId: ${clientId}`,
          ipAddress,
          userAgent,
        });
      };

      // Store cleanup function for later use
      (controller as unknown as { cleanup: () => void }).cleanup = cleanup;
    },
    cancel(controller) {
      const ctrl = controller as unknown as { cleanup?: () => void };
      if (ctrl.cleanup) {
        ctrl.cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
