import { NextRequest, NextResponse } from "next/server";
import {
  getReservations,
  addReservation,
  deleteReservation,
} from "@/lib/reservations";

export async function GET() {
  try {
    const reservations = getReservations();
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Failed to get reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, timeSlot, name } = body;

    if (!date || !timeSlot || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reservation = addReservation({ date, timeSlot, name });
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Failed to add reservation:", error);
    if (error instanceof Error && error.message === "Slot already reserved") {
      return NextResponse.json(
        { error: "Slot already reserved" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: "Missing date or timeSlot" },
        { status: 400 }
      );
    }

    const success = deleteReservation(date, timeSlot);
    if (!success) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
