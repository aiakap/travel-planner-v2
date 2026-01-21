"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Get user profile with all related data
export async function getUserProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const contacts = await prisma.userContact.findMany({
    where: { userId },
    include: {
      contactType: true,
    },
    orderBy: [
      { isPrimary: 'desc' },
      { contactType: { sortOrder: 'asc' } },
    ],
  });

  const hobbies = await prisma.userHobby.findMany({
    where: { userId },
    include: {
      hobby: true,
    },
    orderBy: {
      hobby: { sortOrder: 'asc' },
    },
  });

  const travelPreferences = await prisma.userTravelPreference.findMany({
    where: { userId },
    include: {
      preferenceType: true,
      option: true,
    },
    orderBy: {
      preferenceType: { sortOrder: 'asc' },
    },
  });

  const relationships = await prisma.userRelationship.findMany({
    where: { userId },
    include: {
      relatedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    profile,
    contacts,
    hobbies,
    travelPreferences,
    relationships,
  };
}

// Update or create user profile
export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  country?: string;
  loyaltyPrograms?: any;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  // Invalidate cache
  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return profile;
}

// Contact actions
export async function addContact(data: {
  contactTypeId: string;
  value: string;
  label?: string;
  isPrimary?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // If this is being set as primary, unset other primary contacts of the same type
  if (data.isPrimary) {
    await prisma.userContact.updateMany({
      where: {
        userId: session.user.id,
        contactTypeId: data.contactTypeId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.userContact.create({
    data: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  return contact;
}

export async function updateContact(contactId: string, data: {
  value?: string;
  label?: string;
  isPrimary?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userContact.findUnique({
    where: { id: contactId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Contact not found or unauthorized");
  }

  // If setting as primary, unset other primary contacts of the same type
  if (data.isPrimary) {
    await prisma.userContact.updateMany({
      where: {
        userId: session.user.id,
        contactTypeId: existing.contactTypeId,
        isPrimary: true,
        id: { not: contactId },
      },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.userContact.update({
    where: { id: contactId },
    data,
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  return contact;
}

export async function deleteContact(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userContact.findUnique({
    where: { id: contactId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Contact not found or unauthorized");
  }

  await prisma.userContact.delete({
    where: { id: contactId },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
}

// Hobby actions
export async function addHobby(hobbyId: string, level?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userHobby = await prisma.userHobby.create({
    data: {
      userId: session.user.id,
      hobbyId,
      level,
    },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return userHobby;
}

export async function updateHobbyLevel(userHobbyId: string, level: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userHobby.findUnique({
    where: { id: userHobbyId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Hobby not found or unauthorized");
  }

  const userHobby = await prisma.userHobby.update({
    where: { id: userHobbyId },
    data: { level },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return userHobby;
}

export async function removeHobby(userHobbyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userHobby.findUnique({
    where: { id: userHobbyId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Hobby not found or unauthorized");
  }

  await prisma.userHobby.delete({
    where: { id: userHobbyId },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
}

// Travel Preference actions
export async function setTravelPreference(preferenceTypeId: string, optionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const preference = await prisma.userTravelPreference.upsert({
    where: {
      userId_preferenceTypeId: {
        userId: session.user.id,
        preferenceTypeId,
      },
    },
    update: { optionId },
    create: {
      userId: session.user.id,
      preferenceTypeId,
      optionId,
    },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return preference;
}

export async function removeTravelPreference(preferenceTypeId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  await prisma.userTravelPreference.deleteMany({
    where: {
      userId: session.user.id,
      preferenceTypeId,
    },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
}

// Relationship actions
export async function addRelationship(data: {
  relatedUserId: string;
  relationshipType: string;
  nickname?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (data.relatedUserId === session.user.id) {
    throw new Error("Cannot create relationship with yourself");
  }

  const relationship = await prisma.userRelationship.create({
    data: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return relationship;
}

export async function updateRelationship(relationshipId: string, data: {
  relationshipType?: string;
  nickname?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userRelationship.findUnique({
    where: { id: relationshipId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Relationship not found or unauthorized");
  }

  const relationship = await prisma.userRelationship.update({
    where: { id: relationshipId },
    data,
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
  return relationship;
}

export async function deleteRelationship(relationshipId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await prisma.userRelationship.findUnique({
    where: { id: relationshipId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Relationship not found or unauthorized");
  }

  await prisma.userRelationship.delete({
    where: { id: relationshipId },
  });

  revalidateTag(`user-profile-${session.user.id}`);
  revalidatePath("/profile");
  revalidatePath("/"); // Homepage
}

// Get lookup data for forms
export async function getContactTypes() {
  return await prisma.contactType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getHobbies() {
  return await prisma.hobby.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
}

export async function getTravelPreferenceTypes() {
  return await prisma.travelPreferenceType.findMany({
    where: { isActive: true },
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}
