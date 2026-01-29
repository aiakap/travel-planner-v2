import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SegmentEditClient } from "./client"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}

export default async function SegmentEditPage({ params, searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  // Await params and searchParams in Next.js 15
  const { id } = await params
  const { returnTo } = await searchParams

  // Fetch segment with all related data
  const segment = await prisma.segment.findFirst({
    where: {
      id,
      trip: { userId: session.user.id }
    },
    include: {
      segmentType: true,
      trip: {
        include: {
          segments: {
            orderBy: { order: "asc" },
            include: {
              segmentType: true
            }
          }
        }
      },
      reservations: {
        include: {
          reservationType: {
            include: {
              category: true
            }
          }
        },
        orderBy: { startTime: "asc" }
      }
    }
  })

  if (!segment) {
    notFound()
  }

  // Fetch all segment types for dropdown
  const segmentTypes = await prisma.segmentType.findMany({
    orderBy: { name: "asc" }
  })

  return (
    <SegmentEditClient
      segment={segment}
      trip={segment.trip}
      segmentTypes={segmentTypes}
      returnTo={returnTo || `/view1?tab=journey`}
    />
  )
}
