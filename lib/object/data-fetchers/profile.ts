"use server";

/**
 * Profile data fetcher
 * Fetches user profile values from relational database using Prisma
 * This is a server action that can be called from client components
 */

import { getUserProfileValues } from "@/lib/actions/profile-relational-actions";

export async function fetchProfileData(userId: string) {
  try {
    const profileValues = await getUserProfileValues(userId);

    return {
      profileValues,
      hasData: profileValues.length > 0,
    };
  } catch (error) {
    console.error("Error fetching profile data:", error);
    // Return empty array
    return {
      profileValues: [],
      hasData: false,
    };
  }
}
