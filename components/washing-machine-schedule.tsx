"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  WashingMachineIcon,
  XIcon,
} from "lucide-react"

// Time slots (2-hour intervals)
const TIME_SLOTS = [
  "8-10",
  "10-12",
  "12-14",
  "14-16",
  "16-18",
  "18-20",
  "20-22",
] as const

type TimeSlot = (typeof TIME_SLOTS)[number]

interface Reservation {
  date: string // YYYY-MM-DD format
  timeSlot: TimeSlot
  name: string
}

// Helper functions
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDayName(date: Date, locale: string = "en"): string {
  const days: Record<string, string[]> = {
    en: ["Su", "M", "T", "W", "Th", "F", "Sa"],
    de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    ko: ["일", "월", "화", "수", "목", "금", "토"],
  }
  return days[locale]?.[date.getDay()] ?? days.en[date.getDay()]
}

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  return dates
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isPast(date: Date, timeSlot: TimeSlot): boolean {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (checkDate < today) return true
  if (checkDate > today) return false

  // Same day - check time
  const endHour = parseInt(timeSlot.split("-")[1])
  return now.getHours() >= endHour
}

export function WashingMachineSchedule() {
  const [weekStart, setWeekStart] = React.useState<Date>(() => {
    const today = new Date()
    // Start from today
    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
  })

  const [reservations, setReservations] = React.useState<Reservation[]>([])

  const [selectedSlot, setSelectedSlot] = React.useState<{
    date: string
    timeSlot: TimeSlot
  } | null>(null)

  const [userName, setUserName] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const weekDates = getWeekDates(weekStart)

  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() - 7)
    setWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() + 7)
    setWeekStart(newStart)
  }

  const goToToday = () => {
    const today = new Date()
    setWeekStart(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  }

  const getReservation = (date: string, timeSlot: TimeSlot): Reservation | undefined => {
    return reservations.find(
      (r) => r.date === date && r.timeSlot === timeSlot
    )
  }

  const handleCellClick = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = formatDate(date)
    const existing = getReservation(dateStr, timeSlot)

    if (existing || isPast(date, timeSlot)) return

    setSelectedSlot({ date: dateStr, timeSlot })
    setUserName("")
    setDialogOpen(true)
  }

  const handleReserve = () => {
    if (!selectedSlot || !userName.trim()) return

    setReservations((prev) => [
      ...prev,
      {
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot,
        name: userName.trim(),
      },
    ])

    setDialogOpen(false)
    setSelectedSlot(null)
    setUserName("")
  }

  const handleCancelReservation = (date: string, timeSlot: TimeSlot) => {
    setReservations((prev) =>
      prev.filter((r) => !(r.date === date && r.timeSlot === timeSlot))
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WashingMachineIcon className="size-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Washing Machine Schedule</CardTitle>
                <CardDescription>
                  Click on an empty slot to reserve. Your name will be displayed.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center font-medium">Date</TableHead>
                  {TIME_SLOTS.map((slot) => (
                    <TableHead key={slot} className="text-center font-medium min-w-[100px]">
                      {slot}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDates.map((date) => {
                  const dateStr = formatDate(date)
                  const dayName = getDayName(date)
                  const dayNum = date.getDate()
                  const month = date.getMonth() + 1
                  const todayClass = isToday(date) ? "bg-primary/5" : ""

                  return (
                    <TableRow key={dateStr} className={todayClass}>
                      <TableCell className="font-medium text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn(
                            "text-xs",
                            isToday(date) && "text-primary font-semibold"
                          )}>
                            {dayName}
                          </span>
                          <span className={cn(
                            "text-sm",
                            isToday(date) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                          )}>
                            {dayNum}.{month}
                          </span>
                        </div>
                      </TableCell>
                      {TIME_SLOTS.map((timeSlot) => {
                        const reservation = getReservation(dateStr, timeSlot)
                        const past = isPast(date, timeSlot)

                        return (
                          <TableCell
                            key={`${dateStr}-${timeSlot}`}
                            className={cn(
                              "text-center p-1",
                              !reservation && !past && "cursor-pointer hover:bg-muted/50 transition-colors"
                            )}
                            onClick={() => handleCellClick(date, timeSlot)}
                          >
                            {reservation ? (
                              <div className="group relative">
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  {reservation.name}
                                </Badge>
                                {!past && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCancelReservation(dateStr, timeSlot)
                                    }}
                                    className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <XIcon className="size-3" />
                                  </button>
                                )}
                              </div>
                            ) : past ? (
                              <span className="text-muted-foreground/40 text-xs">-</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">
                                available
                              </span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted border border-border" />
              <span>Available (click to reserve)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted-foreground/10 border border-muted-foreground/20" />
              <span>Past</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Time Slot</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  Reserve the washing machine for{" "}
                  <strong>
                    {new Date(selectedSlot.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>{" "}
                  at <strong>{selectedSlot.timeSlot}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userName.trim()) {
                  handleReserve()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleReserve} disabled={!userName.trim()}>
              Reserve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
