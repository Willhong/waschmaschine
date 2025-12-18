import fs from "fs";
import path from "path";

export interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  name: string;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "reservations.json");

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf-8");
  }
}

export function getReservations(): Reservation[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addReservation(
  reservation: Omit<Reservation, "id" | "createdAt">
): Reservation {
  ensureDataDir();
  const reservations = getReservations();

  // Check for duplicates
  const existing = reservations.find(
    (r) => r.date === reservation.date && r.timeSlot === reservation.timeSlot
  );
  if (existing) {
    throw new Error("Slot already reserved");
  }

  const newReservation: Reservation = {
    ...reservation,
    id: `${reservation.date}-${reservation.timeSlot}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  reservations.push(newReservation);
  fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2), "utf-8");

  // Notify SSE clients
  notifyClients({ type: "add", reservation: newReservation });

  return newReservation;
}

export function deleteReservation(date: string, timeSlot: string): boolean {
  ensureDataDir();
  const reservations = getReservations();
  const index = reservations.findIndex(
    (r) => r.date === date && r.timeSlot === timeSlot
  );

  if (index === -1) {
    return false;
  }

  const deleted = reservations.splice(index, 1)[0];
  fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2), "utf-8");

  // Notify SSE clients
  notifyClients({ type: "delete", reservation: deleted });

  return true;
}

// SSE client management
type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients: Map<string, SSEClient> = new Map();

export function addSSEClient(
  id: string,
  controller: ReadableStreamDefaultController
) {
  clients.set(id, { id, controller });
}

export function removeSSEClient(id: string) {
  clients.delete(id);
}

function notifyClients(event: {
  type: "add" | "delete";
  reservation: Reservation;
}) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();

  clients.forEach((client) => {
    try {
      client.controller.enqueue(encoder.encode(data));
    } catch {
      // Client disconnected
      clients.delete(client.id);
    }
  });
}
