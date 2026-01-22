"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ConnectedAccount = {
  id: number;
  provider: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isPrimaryLogin: boolean;
  canLogin: boolean;
  lastLoginAt: Date | null;
  linkedAt: Date;
  syncStatus: string;
};

/**
 * Get all connected accounts for the current user
 */
export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  
  const accounts = await prisma.account.findMany({
    where: { 
      userId: session.user.id,
      canLogin: true 
    },
    orderBy: [
      { isPrimaryLogin: 'desc' },
      { createdAt: 'asc' }
    ],
    select: {
      id: true,
      provider: true,
      isPrimaryLogin: true,
      canLogin: true,
      lastLoginAt: true,
      createdAt: true,
      syncStatus: true,
    }
  });
  
  return accounts.map(account => ({
    id: account.id,
    provider: account.provider,
    email: null, // We'll get this from the user
    name: null,
    image: null,
    isPrimaryLogin: account.isPrimaryLogin,
    canLogin: account.canLogin,
    lastLoginAt: account.lastLoginAt,
    linkedAt: account.createdAt,
    syncStatus: account.syncStatus,
  }));
}

/**
 * Get available providers (not yet connected)
 */
export async function getAvailableProviders(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  const connectedAccounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true }
  });
  
  const connectedProviders = new Set(connectedAccounts.map(a => a.provider));
  const allProviders = ["google", "facebook", "apple", "twitter", "linkedin", "spotify", "github"];
  
  return allProviders.filter(p => !connectedProviders.has(p));
}

/**
 * Disconnect a provider account
 * Validates that at least one account remains
 */
export async function disconnectProvider(provider: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  
  // Count active accounts
  const activeAccounts = await prisma.account.count({
    where: {
      userId: session.user.id,
      canLogin: true,
      syncStatus: "active"
    }
  });
  
  if (activeAccounts <= 1) {
    return {
      success: false,
      error: "Cannot disconnect your only login method. Please add another account first."
    };
  }
  
  // Disconnect the account
  await prisma.account.updateMany({
    where: {
      userId: session.user.id,
      provider
    },
    data: {
      canLogin: false,
      syncStatus: "disconnected"
    }
  });
  
  revalidatePath("/settings/accounts");
  return { success: true };
}

/**
 * Set a provider as primary
 */
export async function setPrimaryAccount(provider: string): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  
  // Unset all primary flags
  await prisma.account.updateMany({
    where: { userId: session.user.id },
    data: { isPrimaryLogin: false }
  });
  
  // Set new primary
  await prisma.account.updateMany({
    where: {
      userId: session.user.id,
      provider
    },
    data: { isPrimaryLogin: true }
  });
  
  revalidatePath("/settings/accounts");
  return { success: true };
}

/**
 * Validate that user has at least one active account
 */
export async function validateAccountRequirement(userId: string): Promise<boolean> {
  const activeAccounts = await prisma.account.count({
    where: {
      userId,
      canLogin: true,
      syncStatus: "active"
    }
  });
  
  return activeAccounts >= 1;
}

/**
 * Get account statistics
 */
export async function getAccountStats() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: {
      provider: true,
      canLogin: true,
      syncStatus: true,
      lastLoginAt: true,
    }
  });
  
  return {
    total: accounts.length,
    active: accounts.filter(a => a.canLogin && a.syncStatus === "active").length,
    disconnected: accounts.filter(a => !a.canLogin).length,
    providers: accounts.map(a => a.provider),
    lastUsed: accounts
      .filter(a => a.lastLoginAt)
      .sort((a, b) => (b.lastLoginAt?.getTime() || 0) - (a.lastLoginAt?.getTime() || 0))[0]
  };
}
