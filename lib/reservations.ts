import { db } from "./db";

export interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  userId: string;
  userColor?: string;
  createdAt: string;
}

export function getReservations(): Reservation[] {
  return db.query("SELECT * FROM reservations").all() as Reservation[];
}

export function addReservation(
  reservation: Omit<Reservation, "id" | "createdAt">
): Reservation {
  // Check for duplicates
  const existing = db
    .query("SELECT * FROM reservations WHERE date = ? AND timeSlot = ?")
    .get(reservation.date, reservation.timeSlot);

  if (existing) {
    throw new Error("Slot already reserved");
  }

  const newReservation: Reservation = {
    ...reservation,
    id: `${reservation.date}-${reservation.timeSlot}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  db.run(
    `INSERT INTO reservations (id, date, timeSlot, userId, userColor, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newReservation.id,
      newReservation.date,
      newReservation.timeSlot,
      newReservation.userId,
      newReservation.userColor || null,
      newReservation.createdAt,
    ]
  );

  // Notify SSE clients
  notifyClients({ type: "add", reservation: newReservation });

  return newReservation;
}

export function deleteReservation(date: string, timeSlot: string): boolean {
  const existing = db
    .query("SELECT * FROM reservations WHERE date = ? AND timeSlot = ?")
    .get(date, timeSlot) as Reservation | null;

  if (!existing) {
    return false;
  }

  db.run("DELETE FROM reservations WHERE date = ? AND timeSlot = ?", [
    date,
    timeSlot,
  ]);

  // Notify SSE clients
  notifyClients({ type: "delete", reservation: existing });

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
