import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReservationEditClient } from "./client"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string; source?: string }>
}

export default async function ReservationEditPage({ params, searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  const { id } = await params
  const searchParamsResolved = await searchParams

  // Fetch reservation with all related data
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: id,
      segment: { trip: { userId: session.user.id } }
    },
    include: {
      reservationType: {
        include: {
          category: true,
          displayGroup: true
        }
      },
      reservationStatus: true,
      segment: {
        include: {
          reservations: {
            include: {
              reservationType: {
                include: {
                  category: true
                }
              }
            },
            orderBy: { startTime: "asc" }
          },
          trip: {
            include: {
              segments: {
                orderBy: { order: "asc" },
                include: {
                  reservations: {
                    where: {
                      startTime: { not: null }
                    },
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
              }
            }
          }
        }
      }
    }
  })

  if (!reservation) {
    notFound()
  }

  // Fetch all categories with types and display groups
  const categories = await prisma.reservationCategory.findMany({
    include: {
      types: {
        include: {
          displayGroup: true
        },
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  })

  // Fetch all statuses
  const statuses = await prisma.reservationStatus.findMany({
    orderBy: { name: "asc" }
  })

  // Check if this is from natural language creation
  const isFromNaturalLanguage = searchParamsResolved.source === 'natural-language'
  const originalInput = reservation.metadata && typeof reservation.metadata === 'object'
    ? (reservation.metadata as any).naturalLanguageInput
    : null

  return (
    <ReservationEditClient
      reservation={reservation}
      trip={reservation.segment.trip}
      segment={reservation.segment}
      categories={categories}
      statuses={statuses}
      returnTo={searchParamsResolved.returnTo || `/view1?tab=journey`}
      isFromNaturalLanguage={isFromNaturalLanguage}
      originalInput={originalInput}
    />
  )
}
