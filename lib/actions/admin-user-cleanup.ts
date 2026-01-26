"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Verify admin privileges (implement your auth logic)
 */
async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  // Add admin role check here when you implement roles
  // For now, any authenticated user can access (add security later)
  return session.user.id;
}

/**
 * Search users by email or name
 */
export async function searchUsers(query: string) {
  await verifyAdmin();
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          trips: true,
          conversations: true
        }
      },
      profile: {
        select: { id: true, firstName: true, lastName: true }
      },
      profileGraph: {
        select: { id: true }
      }
    },
    take: 20
  });
  
  return users;
}

/**
 * Get detailed user info for confirmation
 */
export async function getUserDetails(userId: string) {
  await verifyAdmin();
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          city: true,
          country: true
        }
      },
      profileGraph: {
        select: { id: true, updatedAt: true }
      },
      trips: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          _count: {
            select: {
              segments: true,
              conversations: true
            }
          }
        }
      },
      _count: {
        select: {
          trips: true,
          conversations: true,
          contacts: true,
          hobbies: true,
          profileValues: true,
          travelPreferences: true
        }
      }
    }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

/**
 * Delete user profile only
 */
export async function deleteUserProfile(userId: string) {
  await verifyAdmin();
  
  const profile = await prisma.userProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) {
    return { success: true, message: "No profile to delete" };
  }
  
  await prisma.userProfile.delete({
    where: { userId }
  });
  
  return { success: true, message: "Profile deleted successfully" };
}

/**
 * Delete user profile graph only
 */
export async function deleteUserProfileGraph(userId: string) {
  await verifyAdmin();
  
  const graph = await prisma.userProfileGraph.findUnique({
    where: { userId }
  });
  
  if (!graph) {
    return { success: true, message: "No profile graph to delete" };
  }
  
  await prisma.userProfileGraph.delete({
    where: { userId }
  });
  
  return { success: true, message: "Profile graph deleted successfully" };
}

/**
 * Delete a single trip (cascade handles segments, reservations, chats)
 */
export async function deleteUserTrip(tripId: string, userId: string) {
  await verifyAdmin();
  
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId }
  });
  
  if (!trip) {
    throw new Error("Trip not found for this user");
  }
  
  // Get counts before deletion for reporting
  const counts = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      _count: {
        select: {
          segments: true,
          conversations: true
        }
      }
    }
  });
  
  await prisma.trip.delete({
    where: { id: tripId }
  });
  
  return { 
    success: true, 
    message: `Deleted trip with ${counts?._count.segments || 0} segments and ${counts?._count.conversations || 0} conversations`
  };
}

/**
 * Delete all user trips (cascade handles everything nested)
 */
export async function deleteAllUserTrips(userId: string) {
  await verifyAdmin();
  
  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { id: true }
  });
  
  if (trips.length === 0) {
    return { success: true, message: "No trips to delete" };
  }
  
  await prisma.trip.deleteMany({
    where: { userId }
  });
  
  return { 
    success: true, 
    message: `Deleted ${trips.length} trip(s) with all related data`
  };
}

/**
 * Delete ALL user data (nuclear option)
 * This deletes:
 * - Profile
 * - Profile Graph  
 * - All ProfileValues
 * - All Trips (and cascaded: segments, reservations, chats)
 * - All standalone ChatConversations
 * - All Contacts
 * - All Hobbies
 * - All Travel Preferences
 */
export async function deleteAllUserData(userId: string) {
  await verifyAdmin();
  
  // Get counts before deletion
  const counts = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: {
          trips: true,
          conversations: true,
          contacts: true,
          hobbies: true,
          profileValues: true,
          travelPreferences: true
        }
      }
    }
  });
  
  // Delete in transaction for safety
  await prisma.$transaction([
    // Profile and graph are cascade deleted by user delete
    // But we can delete them explicitly first for clarity
    prisma.userProfile.deleteMany({ where: { userId } }),
    prisma.userProfileGraph.deleteMany({ where: { userId } }),
    prisma.userProfileValue.deleteMany({ where: { userId } }),
    prisma.userContact.deleteMany({ where: { userId } }),
    prisma.userHobby.deleteMany({ where: { userId } }),
    prisma.userTravelPreference.deleteMany({ where: { userId } }),
    prisma.userRelationship.deleteMany({ 
      where: { OR: [{ userId }, { relatedUserId: userId }] } 
    }),
    // Trips deletion cascades to segments, reservations, and chats
    prisma.trip.deleteMany({ where: { userId } }),
    // Standalone conversations
    prisma.chatConversation.deleteMany({ where: { userId } }),
  ]);
  
  return {
    success: true,
    message: `Deleted all data for user`,
    details: {
      trips: counts?._count.trips || 0,
      conversations: counts?._count.conversations || 0,
      contacts: counts?._count.contacts || 0,
      hobbies: counts?._count.hobbies || 0,
      profileValues: counts?._count.profileValues || 0,
      travelPreferences: counts?._count.travelPreferences || 0
    }
  };
}
