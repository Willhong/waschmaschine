import { db } from "./db";

export interface ServerProfile {
  id: string;
  name: string;
  color: string;
  updatedAt: string;
}

export function getAllProfiles(): Record<string, ServerProfile> {
  const rows = db.query("SELECT * FROM profiles").all() as ServerProfile[];
  const profiles: Record<string, ServerProfile> = {};
  for (const row of rows) {
    profiles[row.id] = row;
  }
  return profiles;
}

export function getProfile(userId: string): ServerProfile | null {
  return (
    (db.query("SELECT * FROM profiles WHERE id = ?").get(userId) as ServerProfile | null) ||
    null
  );
}

export function saveProfile(profile: ServerProfile): ServerProfile {
  const updatedProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  db.run(
    `INSERT OR REPLACE INTO profiles (id, name, color, updatedAt)
     VALUES (?, ?, ?, ?)`,
    [
      updatedProfile.id,
      updatedProfile.name,
      updatedProfile.color,
      updatedProfile.updatedAt,
    ]
  );

  // Notify SSE clients about profile update
  notifyProfileUpdate(updatedProfile);

  return updatedProfile;
}

// SSE client management for profile updates
type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const profileClients: Map<string, SSEClient> = new Map();

export function addProfileSSEClient(
  id: string,
  controller: ReadableStreamDefaultController
) {
  profileClients.set(id, { id, controller });
}

export function removeProfileSSEClient(id: string) {
  profileClients.delete(id);
}

function notifyProfileUpdate(profile: ServerProfile) {
  const data = `data: ${JSON.stringify({ type: "profile_update", profile })}\n\n`;
  const encoder = new TextEncoder();

  profileClients.forEach((client) => {
    try {
      client.controller.enqueue(encoder.encode(data));
    } catch {
      // Client disconnected
      profileClients.delete(client.id);
    }
  });
}
