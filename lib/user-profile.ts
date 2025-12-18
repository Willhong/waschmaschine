// User profile management (localStorage-based)

export interface UserProfile {
  id: string; // Unique user identifier
  name: string;
  color: string; // Hex color from palette
}

// Pre-defined color palette (9 colors + custom picker)
export const COLOR_PALETTE = [
  { id: "blue", name: "Blue", value: "#3B82F6" },
  { id: "red", name: "Red", value: "#EF4444" },
  { id: "green", name: "Green", value: "#10B981" },
  { id: "amber", name: "Amber", value: "#F59E0B" },
  { id: "violet", name: "Violet", value: "#8B5CF6" },
  { id: "pink", name: "Pink", value: "#EC4899" },
  { id: "teal", name: "Teal", value: "#14B8A6" },
  { id: "orange", name: "Orange", value: "#F97316" },
  { id: "indigo", name: "Indigo", value: "#6366F1" },
] as const;

export type ColorOption = (typeof COLOR_PALETTE)[number];

const STORAGE_KEY = "waschmaschine:user-profile";

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load user profile from localStorage
 * Returns null if no profile exists or if localStorage is unavailable
 */
export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const profile = JSON.parse(data);

    // Migrate old profiles without id
    if (!profile.id) {
      profile.id = generateUserId();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }

    return profile;
  } catch {
    return null;
  }
}

/**
 * Save user profile to localStorage
 * Generates an ID if not provided
 */
export function saveUserProfile(profile: Omit<UserProfile, "id"> & { id?: string }): UserProfile {
  if (typeof window === "undefined") return { ...profile, id: "" } as UserProfile;

  try {
    const fullProfile: UserProfile = {
      ...profile,
      id: profile.id || generateUserId(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullProfile));
    return fullProfile;
  } catch (error) {
    console.error("Failed to save user profile:", error);
    return { ...profile, id: profile.id || "" } as UserProfile;
  }
}

/**
 * Clear user profile from localStorage
 */
export function clearUserProfile(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Generate a consistent color for a given name
 * Used for existing reservations that don't have a color assigned
 */
export function getColorForName(name: string): string {
  if (!name) return COLOR_PALETTE[0].value;

  // Simple hash function
  let hash = 0;
  const normalizedName = name.toLowerCase().trim();
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index].value;
}
