"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  UserContext, 
  OAuthProfileData, 
  AccountInfo,
  UserProfileData,
  ProfileGraphSummary,
  UserContextDisplay,
  MinimalUserContext
} from "@/lib/types/user-context";
import { getUserProfileValues } from "@/lib/actions/profile-relational-actions";
import { getProfileSummary, UserProfileValueWithRelations } from "@/lib/profile-relational-adapter";

/**
 * Get complete user context including OAuth, profile, and graph data
 */
export async function getUserContext(userId?: string): Promise<UserContext> {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) {
    throw new Error("User not authenticated");
  }
  
  // Only allow users to access their own context
  if (userId && userId !== session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  console.log("📊 [getUserContext] Fetching context for user:", targetUserId);
  
  try {
    // Fetch all data in parallel for performance
    const [user, accounts, profileData, graphData] = await Promise.all([
      // User basic info
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
        }
      }),
      
      // OAuth accounts
      prisma.account.findMany({
        where: { userId: targetUserId },
        select: {
          provider: true,
          providerAccountId: true,
          access_token: true,
          refresh_token: true,
          expires_at: true,
          scope: true,
          lastLoginAt: true,
          oauth_profile_data: true,
        },
        orderBy: {
          lastLoginAt: 'desc'
        }
      }),
      
      // Profile data
      getUserProfileData(targetUserId),
      
      // Profile graph
      getUserProfileGraphSummary(targetUserId)
    ]);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Process accounts and extract OAuth profiles
    const accountInfos: AccountInfo[] = accounts.map(account => ({
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expires_at: account.expires_at,
      scope: account.scope,
      lastLoginAt: account.lastLoginAt,
      oauth_profile_data: account.oauth_profile_data as OAuthProfileData | null
    }));
    
    // Get primary OAuth profile (Google first, then first account)
    const primaryAccount = accounts.find(a => a.provider === 'google') || accounts[0];
    const oauthProfile = primaryAccount?.oauth_profile_data as OAuthProfileData | null;
    
    console.log("✅ [getUserContext] Context assembled:", {
      userId: user.id,
      accountsCount: accounts.length,
      hasOAuthProfile: !!oauthProfile,
      oauthProvider: primaryAccount?.provider,
      hasBasicProfile: !!profileData.basic,
      contactsCount: profileData.contacts.length,
      hobbiesCount: profileData.hobbies.length,
      travelPrefsCount: profileData.travelPreferences.length,
      hasGraph: graphData.hasGraph,
      graphItemCount: graphData.itemCount,
    });
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      accounts: accountInfos,
      oauthProfile,
      profile: profileData,
      profileGraph: graphData,
      lastFetched: new Date(),
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error("[getUserContext] Error fetching user context:", error);
    throw error;
  }
}

/**
 * Get user profile data with all related information
 */
async function getUserProfileData(userId: string): Promise<UserProfileData> {
  console.log("📋 [getUserProfileData] Fetching profile data for user:", userId);
  
  const [profile, contacts, hobbies, travelPreferences, relationships] = await Promise.all([
    // Basic profile
    prisma.userProfile.findUnique({
      where: { userId }
    }),
    
    // Contacts with types
    prisma.userContact.findMany({
      where: { userId },
      include: {
        contactType: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { contactType: { sortOrder: 'asc' } }
      ]
    }),
    
    // Hobbies
    prisma.userHobby.findMany({
      where: { userId },
      include: {
        hobby: true
      },
      orderBy: {
        hobby: { sortOrder: 'asc' }
      }
    }),
    
    // Travel preferences
    prisma.userTravelPreference.findMany({
      where: { userId },
      include: {
        preferenceType: true,
        option: true
      },
      orderBy: {
        preferenceType: { sortOrder: 'asc' }
      }
    }),
    
    // Relationships
    prisma.userRelationship.findMany({
      where: { userId },
      include: {
        relatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })
  ]);
  
  console.log("✅ [getUserProfileData] Profile data fetched:", {
    hasProfile: !!profile,
    contactsCount: contacts.length,
    hobbiesCount: hobbies.length,
    travelPrefsCount: travelPreferences.length,
    relationshipsCount: relationships.length,
  });
  
  return {
    basic: profile,
    contacts,
    hobbies,
    travelPreferences,
    relationships
  };
}

/**
 * Get profile graph summary
 * Now uses relational data instead of XML
 */
async function getUserProfileGraphSummary(userId: string): Promise<ProfileGraphSummary> {
  console.log("🕸️ [getUserProfileGraphSummary] Fetching profile values for user:", userId);
  
  try {
    // Fetch user profile values from relational tables
    const userValues = await getUserProfileValues(userId) as UserProfileValueWithRelations[];
    
    // Use adapter to get summary
    const summary = getProfileSummary(userValues);
    
    console.log("✅ [getUserProfileGraphSummary] Profile summary:", {
      hasData: summary.hasData,
      itemCount: summary.itemCount,
      categoriesCount: summary.categories.length,
      lastUpdated: summary.lastUpdated,
    });
    
    return {
      hasGraph: summary.hasData,
      itemCount: summary.itemCount,
      categories: summary.categories,
      lastUpdated: summary.lastUpdated
    };
  } catch (error) {
    console.error("❌ [getUserProfileGraphSummary] Error:", error);
    return {
      hasGraph: false,
      itemCount: 0,
      categories: [],
      lastUpdated: null
    };
  }
}

/**
 * Get minimal user context for quick access (e.g., in navbar)
 */
export async function getMinimalUserContext(userId?: string): Promise<MinimalUserContext | null> {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) {
    return null;
  }
  
  try {
    const [user, profile, graph] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true
        }
      }),
      prisma.userProfile.findUnique({
        where: { userId: targetUserId },
        select: { id: true }
      }),
      prisma.userProfileGraph.findUnique({
        where: { userId: targetUserId },
        select: { id: true }
      })
    ]);
    
    if (!user) {
      return null;
    }
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      hasProfile: !!profile,
      hasGraph: !!graph
    };
  } catch (error) {
    console.error("[getMinimalUserContext] Error:", error);
    return null;
  }
}

/**
 * Get user context formatted for display in modal
 */
export async function getUserContextForDisplay(userId?: string): Promise<UserContextDisplay> {
  const context = await getUserContext(userId);
  
  return {
    user: {
      id: context.userId,
      email: context.email,
      name: context.name,
      image: context.image,
      emailVerified: context.emailVerified,
      createdAt: context.createdAt
    },
    oauth: context.oauthProfile,
    accounts: context.accounts,
    profile: context.profile,
    graph: context.profileGraph
  };
}

/**
 * Update OAuth profile data for an account
 */
export async function updateOAuthProfileData(
  userId: string,
  provider: string,
  profileData: OAuthProfileData
): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    await prisma.account.updateMany({
      where: {
        userId,
        provider
      },
      data: {
        oauth_profile_data: profileData as any
      }
    });
    
    console.log(`[updateOAuthProfileData] Updated OAuth profile for ${provider}`);
  } catch (error) {
    console.error("[updateOAuthProfileData] Error:", error);
    throw error;
  }
}
