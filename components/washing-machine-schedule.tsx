"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

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
  date: string;
  timeSlot: TimeSlot;
  name: string;
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
  const [userName, setUserName] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

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

    setSelectedSlot({ date: dateStr, timeSlot });
    setUserName("");
    setDialogOpen(true);
  };

  const handleReserve = () => {
    if (!selectedSlot || !userName.trim()) return;

    setReservations((prev) => [
      ...prev,
      {
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot,
        name: userName.trim(),
      },
    ]);

    setDialogOpen(false);
    setSelectedSlot(null);
    setUserName("");
  };

  const handleCancelReservation = (date: string, timeSlot: TimeSlot) => {
    setReservations((prev) =>
      prev.filter((r) => !(r.date === date && r.timeSlot === timeSlot))
    );
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
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
              Washing Machine
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Tap a slot to book your laundry time
            </p>
          </div>
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
      <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Time slots header */}
            <div className="grid grid-cols-8 border-b border-border/50 bg-muted/30">
              <div className="p-2 sm:p-3 flex items-center justify-center">
                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="p-2 sm:p-3 text-center border-l border-border/30"
                >
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground tracking-wide whitespace-nowrap">
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
                  <div className="p-2 sm:p-3 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-[9px] sm:text-[10px] uppercase tracking-wider font-medium",
                          today ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {dayName}
                      </span>
                      <span
                        className={cn(
                          "text-base sm:text-lg font-display font-semibold leading-none transition-all",
                          today
                            ? "w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm text-sm sm:text-base"
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
                          "relative p-1.5 sm:p-2 border-l border-border/30 min-h-[50px] sm:min-h-[60px] flex items-center justify-center transition-all duration-200",
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
                          <div
                            className="group/res relative w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              className={cn(
                                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-center transition-all duration-200",
                                "bg-gradient-to-r from-primary/15 to-primary/10",
                                "border border-primary/20",
                                "shadow-sm",
                                !past &&
                                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                              )}
                            >
                              <span className="text-xs sm:text-sm font-medium text-primary truncate block">
                                {reservation.name}
                              </span>
                            </div>
                            {!past && (
                              <button
                                onClick={() =>
                                  handleCancelReservation(dateStr, timeSlot)
                                }
                                className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover/res:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-110"
                              >
                                <svg
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
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
                        ) : past ? (
                          <div className="w-4 sm:w-6 h-0.5 rounded-full bg-border" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 sm:transition-opacity sm:duration-200">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary/50"
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
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-3 sm:w-6 sm:h-4 rounded bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/20" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-3 sm:w-6 sm:h-4 rounded border-2 border-dashed border-primary/30" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-3 sm:w-6 sm:h-4 rounded bg-muted/50 flex items-center justify-center">
            <div className="w-2 sm:w-3 h-0.5 rounded-full bg-border" />
          </div>
          <span>Past</span>
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/60 sm:hidden">
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
          <div className="py-4 sm:py-6">
            <Input
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userName.trim()) {
                  handleReserve();
                }
              }}
              autoFocus
              className="text-base h-11 sm:h-12 rounded-lg sm:rounded-xl"
            />
          </div>
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
              disabled={!userName.trim()}
              className="rounded-lg sm:rounded-xl px-6 w-full sm:w-auto"
            >
              Book Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
