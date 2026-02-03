import { NextRequest, NextResponse } from "next/server"
import { getSampleEmail, listSampleEmails } from "@/lib/sample-email-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      const samples = await listSampleEmails()
      return NextResponse.json({ samples })
    }

    const sample = await getSampleEmail(id)
    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error("Failed to load sample emails", error)
    return NextResponse.json({ error: "Failed to load sample emails" }, { status: 500 })
  }
}
