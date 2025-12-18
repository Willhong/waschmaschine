import { addProfileSSEClient, removeProfileSSEClient } from "@/lib/profiles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const clientId = `profile-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`)
      );

      // Register this client
      addProfileSSEClient(clientId, controller);

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
        removeProfileSSEClient(clientId);
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
