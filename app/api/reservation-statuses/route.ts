import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const statuses = await prisma.reservationStatus.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching reservation statuses:", error);
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 });
  }
}
