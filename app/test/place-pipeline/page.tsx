import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { PlacePipelineClient } from "./client";

export default async function PlacePipelineTestPage() {
  const session = await auth();
  
  let user = null;
  let trips: any[] = [];
  let profileData = null;

  if (session?.user?.id) {
    // Fetch user's trips with full relations (copied from experience builder)
    trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true,
                  },
                },
                reservationStatus: true,
              },
              orderBy: { startTime: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch profile data
    profileData = await getUserProfile(session.user.id);

    user = {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || "",
      image: session.user.image || undefined,
    };
  }

  return (
    <PlacePipelineClient
      user={user}
      trips={trips}
      profileData={profileData}
    />
  );
}
