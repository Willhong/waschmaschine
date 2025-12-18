"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
  Loader2Icon,
  WifiIcon,
  WifiOffIcon,
  SettingsIcon,
} from "lucide-react";
import {
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from "@/lib/user-profile";
import { UserProfileDialog } from "@/components/user-profile-dialog";

// Mobile action sheet component
function MobileActionSheet({
  open,
  onClose,
  reservation,
  onCancel,
  serverProfiles,
  userProfile,
}: {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onCancel: () => void;
  serverProfiles: Record<string, { id: string; name: string; color: string }>;
  userProfile: UserProfile | null;
}) {
  // Prevent body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!reservation) return null;

  // Get display name from server profile
  const isMyReservation = userProfile && reservation.userId === userProfile.id;
  const serverProfile = reservation.userId ? serverProfiles[reservation.userId] : null;
  const displayName = isMyReservation
    ? userProfile.name
    : serverProfile?.name || "Unknown";

  const date = new Date(reservation.date + "T00:00:00");
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-card rounded-t-3xl shadow-2xl border-t border-border/50 overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8 pt-2">
            {/* Reservation info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <WashingMachineIcon className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-lg text-foreground truncate">
                  {displayName}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {formattedDate} · {reservation.timeSlot.replace("-", ":00-")}:00
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15 active:bg-destructive/20 active:scale-[0.98] transition-all duration-150"
              >
                <TrashIcon className="w-5 h-5" />
                <span className="font-medium">Cancel Reservation</span>
              </button>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-muted active:bg-muted/70 active:scale-[0.98] transition-all duration-150"
              >
                <XIcon className="w-5 h-5" />
                <span className="font-medium">Close</span>
              </button>
            </div>
          </div>

          {/* Safe area padding for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  );
}

// Time slots (2-hour intervals)
const TIME_SLOTS = [
  "08-10",
  "10-12",
  "12-14",
  "14-16",
  "16-18",
  "18-20",
  "20-22",
] as const;

type TimeSlot = (typeof TIME_SLOTS)[number];

interface Reservation {
  id?: string;
  date: string;
  timeSlot: TimeSlot;
  createdAt?: string;
  userColor?: string;
  userId: string;
}

// Helper functions
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isPast(date: Date, timeSlot: TimeSlot): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (checkDate < today) return true;
  if (checkDate > today) return false;

  const endHour = parseInt(timeSlot.split("-")[1]);
  return now.getHours() >= endHour;
}

function getMonthYear(dates: Date[]): string {
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  });

  if (firstDate.getMonth() === lastDate.getMonth()) {
    return formatter.format(firstDate);
  }

  const firstMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(firstDate);
  const lastMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(lastDate);
  return `${firstMonth} - ${lastMonth}`;
}

// Washing machine SVG icon
function WashingMachineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <path d="M12 8a5 5 0 0 1 4.24 2.35" />
      <circle cx="7" cy="5" r="1" fill="currentColor" />
      <circle cx="17" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}

export function WashingMachineSchedule() {
  const [weekStart, setWeekStart] = React.useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<{
    date: string;
    timeSlot: TimeSlot;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  // Loading and connection states
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  // Mobile action sheet state
  const [actionSheetOpen, setActionSheetOpen] = React.useState(false);
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // User profile state
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = React.useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = React.useState(false);

  // Server profiles map (userId -> profile)
  const [serverProfiles, setServerProfiles] = React.useState<
    Record<string, { id: string; name: string; color: string }>
  >({});

  // Fetch reservations from API
  const fetchReservations = React.useCallback(async () => {
    try {
      const response = await fetch("/api/reservations");
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Fetch server profiles
  const fetchServerProfiles = React.useCallback(async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        setServerProfiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    }
  }, []);

  // Initial fetch of server profiles
  React.useEffect(() => {
    fetchServerProfiles();
  }, [fetchServerProfiles]);

  // Check for user profile on mount
  React.useEffect(() => {
    const profile = getUserProfile();
    if (!profile) {
      setIsFirstTimeUser(true);
      setShowProfileDialog(true);
    } else {
      setUserProfile(profile);
    }
  }, []);

  // SSE connection for real-time updates
  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      const profile = getUserProfile();
      const params = new URLSearchParams();
      if (profile?.id) params.append("userId", profile.id);
      if (profile?.name) params.append("userName", profile.name);
      const queryString = params.toString();
      eventSource = new EventSource(`/api/reservations/stream${queryString ? `?${queryString}` : ""}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "connected") {
            setIsConnected(true);
          } else if (data.type === "add") {
            setReservations((prev) => {
              // Avoid duplicates
              const exists = prev.some(
                (r) =>
                  r.date === data.reservation.date &&
                  r.timeSlot === data.reservation.timeSlot
              );
              if (exists) return prev;
              return [...prev, data.reservation];
            });
          } else if (data.type === "delete") {
            setReservations((prev) =>
              prev.filter(
                (r) =>
                  !(
                    r.date === data.reservation.date &&
                    r.timeSlot === data.reservation.timeSlot
                  )
              )
            );
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();

        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // SSE connection for profile updates
  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/profiles/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "profile_update" && data.profile) {
            setServerProfiles((prev) => ({
              ...prev,
              [data.profile.id]: data.profile,
            }));
          }
        } catch (error) {
          console.error("Failed to parse profile SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Detect mobile device (including tablets up to 768px)
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track keyboard visibility using Visual Viewport API
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const handleResize = () => {
      // Calculate keyboard height by comparing window height with visual viewport
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(keyboardH > 50 ? keyboardH : 0); // Threshold to avoid false positives
    };

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  const weekDates = getWeekDates(weekStart);

  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    setWeekStart(
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  };

  const getReservation = (
    date: string,
    timeSlot: TimeSlot
  ): Reservation | undefined => {
    return reservations.find((r) => r.date === date && r.timeSlot === timeSlot);
  };

  const handleCellClick = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = formatDate(date);
    const existing = getReservation(dateStr, timeSlot);
    if (existing || isPast(date, timeSlot)) return;

    // Don't allow booking without a profile
    if (!userProfile) {
      setShowProfileDialog(true);
      return;
    }

    setSelectedSlot({ date: dateStr, timeSlot });
    setDialogOpen(true);
  };

  const handleReserve = async () => {
    // Get the latest profile from localStorage to avoid race conditions
    const currentProfile = getUserProfile();
    if (!selectedSlot || !currentProfile) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedSlot.date,
          timeSlot: selectedSlot.timeSlot,
          userColor: currentProfile.color,
          userId: currentProfile.id,
          userName: currentProfile.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save reservation:", error);
        return;
      }

      // SSE will update the state, but also update optimistically
      const newReservation = await response.json();
      setReservations((prev) => {
        const exists = prev.some(
          (r) =>
            r.date === newReservation.date &&
            r.timeSlot === newReservation.timeSlot
        );
        if (exists) return prev;
        return [...prev, newReservation];
      });
    } catch (error) {
      console.error("Failed to save reservation:", error);
    } finally {
      setIsSaving(false);
      setDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const handleCancelReservation = async (date: string, timeSlot: TimeSlot) => {
    // Optimistic update
    setReservations((prev) =>
      prev.filter((r) => !(r.date === date && r.timeSlot === timeSlot))
    );

    try {
      const currentProfile = getUserProfile();
      const params = new URLSearchParams({ date, timeSlot });
      if (currentProfile?.id) params.append("userId", currentProfile.id);
      if (currentProfile?.name) params.append("userName", currentProfile.name);

      const response = await fetch(
        `/api/reservations?${params.toString()}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        // Revert on failure
        await fetchReservations();
      }
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      await fetchReservations();
    }
  };

  // Handle reservation click - show action sheet on mobile
  const handleReservationClick = (reservation: Reservation, past: boolean) => {
    if (past) return;
    if (isMobile) {
      setSelectedReservation(reservation);
      setActionSheetOpen(true);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-2">
          <div className="relative shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
              <WashingMachineIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
              Washing Machine
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Tap a slot to book your laundry time
            </p>
          </div>
          {/* Connection status indicator */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              isConnected
                ? "bg-green-500/10 text-green-600"
                : "bg-orange-500/10 text-orange-600"
            )}
            title={isConnected ? "Real-time sync active" : "Reconnecting..."}
          >
            {isConnected ? (
              <WifiIcon className="w-3.5 h-3.5" />
            ) : (
              <WifiOffIcon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
          {/* Profile settings button */}
          {userProfile && (
            <button
              onClick={() => setShowProfileDialog(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full hover:bg-muted transition-colors"
              title="Edit profile"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm"
                style={{ backgroundColor: userProfile.color }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <SettingsIcon className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation & Month Display */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <span className="font-display font-medium text-base sm:text-lg">
            {getMonthYear(weekDates)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={goToPreviousWeek}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={goToToday}
            className="rounded-full px-3 sm:px-4 font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={goToNextWeek}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border/50 overflow-hidden relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading reservations...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Time slots header */}
            <div className="grid grid-cols-8 border-b border-border/50 bg-muted/30">
              <div className="p-2 md:p-3 flex items-center justify-center">
                <ClockIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              </div>
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="p-2 md:p-3 text-center border-l border-border/30"
                >
                  <span className="text-[10px] md:text-xs font-medium text-muted-foreground tracking-wide whitespace-nowrap">
                    {slot}
                  </span>
                </div>
              ))}
            </div>

            {/* Days rows */}
            {weekDates.map((date, rowIndex) => {
              const dateStr = formatDate(date);
              const dayName = getDayName(date);
              const dayNum = date.getDate();
              const today = isToday(date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "grid grid-cols-8 border-b border-border/30 last:border-b-0 transition-colors",
                    today && "bg-primary/[0.03]",
                    isWeekend && !today && "bg-muted/20"
                  )}
                  style={{
                    animationDelay: `${rowIndex * 50}ms`,
                  }}
                >
                  {/* Date cell */}
                  <div className="p-2 md:p-3 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-[9px] md:text-[10px] uppercase tracking-wider font-medium",
                          today ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {dayName}
                      </span>
                      <span
                        className={cn(
                          "text-base md:text-lg font-display font-semibold leading-none transition-all",
                          today
                            ? "w-7 h-7 md:w-9 md:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm text-sm md:text-base"
                            : "text-foreground"
                        )}
                      >
                        {dayNum}
                      </span>
                    </div>
                  </div>

                  {/* Time slot cells */}
                  {TIME_SLOTS.map((timeSlot) => {
                    const reservation = getReservation(dateStr, timeSlot);
                    const past = isPast(date, timeSlot);

                    return (
                      <div
                        key={`${dateStr}-${timeSlot}`}
                        className={cn(
                          "relative p-1.5 md:p-2 border-l border-border/30 min-h-[50px] md:min-h-[60px] flex items-center justify-center transition-all duration-200",
                          !reservation &&
                            !past &&
                            "cursor-pointer group hover:bg-primary/5 active:bg-primary/10",
                          past && "bg-muted/30"
                        )}
                        onClick={() =>
                          !reservation &&
                          !past &&
                          handleCellClick(date, timeSlot)
                        }
                      >
                        {reservation ? (
                          (() => {
                            // Check if this is the current user's reservation
                            const isMyReservation = userProfile && reservation.userId === userProfile.id;
                            // Look up server profile for this reservation's user
                            const serverProfile = reservation.userId ? serverProfiles[reservation.userId] : null;
                            // Use server profile if available, otherwise fall back to stored data
                            const displayName = isMyReservation
                              ? userProfile.name
                              : serverProfile?.name || "Unknown";
                            // Get the color: prioritize server profile, then stored color
                            const displayColor = isMyReservation
                              ? userProfile.color
                              : serverProfile?.color || reservation.userColor || "#888888";
                            return (
                          <div
                            className="group/res relative w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReservationClick(reservation, past);
                            }}
                          >
                            <div
                              className={cn(
                                "px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-center transition-all duration-200",
                                "shadow-sm",
                                !past &&
                                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                                // Mobile: add subtle indicator that it's tappable
                                !past && isMobile && "cursor-pointer"
                              )}
                              style={{
                                backgroundColor: `${displayColor}20`,
                                borderWidth: "1px",
                                borderColor: `${displayColor}40`,
                              }}
                            >
                              <span
                                className="text-xs md:text-sm font-medium truncate block"
                                style={{ color: displayColor }}
                              >
                                {displayName}
                              </span>
                            </div>
                            {/* Desktop: hover delete button */}
                            {!past && !isMobile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelReservation(dateStr, timeSlot);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover/res:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-110"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                            );
                          })()
                        ) : past ? (
                          <div className="w-4 md:w-6 h-0.5 rounded-full bg-border" />
                        ) : (
                          <div
                            className={cn(
                              "flex flex-col items-center gap-1 transition-opacity duration-200",
                              // Mobile: always show subtle indicator
                              isMobile
                                ? "opacity-40 active:opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center transition-all",
                                isMobile
                                  ? "w-4 h-4"
                                  : "w-5 h-5 md:w-6 md:h-6"
                              )}
                            >
                              <svg
                                className={cn(
                                  "text-primary/50",
                                  isMobile
                                    ? "w-2 h-2"
                                    : "w-2.5 h-2.5 md:w-3 md:h-3"
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[10px] md:text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-5 h-3 md:w-6 md:h-4 rounded bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/20" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-5 h-3 md:w-6 md:h-4 rounded border-2 border-dashed border-primary/30" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-5 h-3 md:w-6 md:h-4 rounded bg-muted/50 flex items-center justify-center">
            <div className="w-2 md:w-3 h-0.5 rounded-full bg-border" />
          </div>
          <span>Past</span>
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/60 md:hidden">
        Swipe to see more time slots →
      </p>

      {/* Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl sm:rounded-xl transition-all duration-200"
          style={{
            // When keyboard is open, shift dialog up minimally
            // Using 1/5 of keyboard height to keep it lower
            top:
              keyboardHeight > 0
                ? `calc(50% - ${keyboardHeight / 5}px)`
                : "50%",
            transform: "translateY(-20%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">
              Book Time Slot
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedSlot && (
                <>
                  Reserve for{" "}
                  <span className="font-medium text-foreground">
                    {new Date(
                      selectedSlot.date + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>{" "}
                  from{" "}
                  <span className="font-medium text-foreground">
                    {selectedSlot.timeSlot.replace("-", ":00 - ")}:00
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {userProfile && (
            <div className="py-4 sm:py-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                style={{ backgroundColor: userProfile.color }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{userProfile.name}</p>
                <p className="text-sm text-muted-foreground">Book this slot?</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="rounded-lg sm:rounded-xl w-full sm:w-auto"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              onClick={handleReserve}
              disabled={isSaving}
              className="rounded-lg sm:rounded-xl px-6 w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Slot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Action Sheet for reservations */}
      <MobileActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        reservation={selectedReservation}
        onCancel={() => {
          if (selectedReservation) {
            handleCancelReservation(
              selectedReservation.date,
              selectedReservation.timeSlot
            );
          }
        }}
        serverProfiles={serverProfiles}
        userProfile={userProfile}
      />

      {/* User Profile Dialog */}
      <UserProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onSave={async (profile) => {
          // Preserve existing ID when editing, generate new one for first-time
          const savedProfile = saveUserProfile({
            ...profile,
            id: userProfile?.id,
          });
          setUserProfile(savedProfile);
          setShowProfileDialog(false);
          if (isFirstTimeUser) {
            setIsFirstTimeUser(false);
          }

          // Sync to server for real-time updates across users
          try {
            await fetch("/api/profiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(savedProfile),
            });
          } catch (error) {
            console.error("Failed to sync profile to server:", error);
          }
        }}
        initialProfile={isFirstTimeUser ? undefined : userProfile || undefined}
        isFirstTime={isFirstTimeUser}
      />
    </div>
  );
}
