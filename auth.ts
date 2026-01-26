import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";
import Twitter from "next-auth/providers/twitter";
import LinkedIn from "next-auth/providers/linkedin";
import Spotify from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authLogger } from "@/lib/auth-logger";
import { validateAndLog, getConfiguredProviders } from "@/lib/auth-validation";

// Validate auth configuration on startup
if (process.env.NODE_ENV === "development") {
  validateAndLog();
  
  // Log configured providers
  const configuredProviders = getConfiguredProviders();
  console.log(`🔐 Auth providers: ${configuredProviders.join(", ") || "None configured"}`);
  
  // ADDITIONAL: Verify GitHub specifically
  const hasGitHub = (process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID) && 
                    (process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET);
  console.log(`GitHub OAuth configured: ${hasGitHub ? "YES" : "NO"}`);
  if (hasGitHub) {
    console.log(`GitHub Client ID: ${(process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID)?.substring(0, 10)}...`);
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    // GitHub - Keep as primary/fallback
    ...((process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID) && 
       (process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET))
      ? [GitHub({
          clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID!,
          clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET!,
        })]
      : [],
    
    // Google - Only if configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              scope: [
                "openid",
                "profile", 
                "email",
                "https://www.googleapis.com/auth/youtube.readonly",
              ].join(" "),
              access_type: "offline",
              prompt: "consent",
            }
          }
        })]
      : [],
    
    // Facebook - Only if configured
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
      ? [Facebook({
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          authorization: {
            params: {
              scope: "public_profile,email,user_likes",
            }
          }
        })]
      : [],
    
    // Apple - Only if configured
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)
      ? [Apple({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        })]
      : [],
    
    // Twitter - Only if configured
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET)
      ? [Twitter({
          clientId: process.env.TWITTER_CLIENT_ID,
          clientSecret: process.env.TWITTER_CLIENT_SECRET,
        })]
      : [],
    
    // LinkedIn - Only if configured
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
      ? [LinkedIn({
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          authorization: {
            params: {
              scope: "openid profile email"
            }
          }
        })]
      : [],
    
    // Spotify - Only if configured
    ...(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
      ? [Spotify({
          clientId: process.env.SPOTIFY_CLIENT_ID,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
          authorization: {
            params: {
              scope: "user-read-email user-read-private user-top-read user-read-recently-played user-library-read"
            }
          }
        })]
      : [],
  ],
  
  adapter: PrismaAdapter(prisma),
  
  pages: {
    signIn: "/login",
    error: "/login/error",
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // COMPREHENSIVE DEBUG LOGGING
        console.log("=== SIGNIN CALLBACK START ===");
        console.log("User object:", JSON.stringify(user, null, 2));
        console.log("Account object:", JSON.stringify(account, null, 2));
        console.log("Profile object:", JSON.stringify(profile, null, 2));
        console.log("User ID:", user.id);
        console.log("User Email:", user.email);
        console.log("User Name:", user.name);
        console.log("Account Provider:", account?.provider);
        console.log("Account Provider Account ID:", account?.providerAccountId);
        console.log("Account Access Token:", account?.access_token ? "Present" : "Missing");
        console.log("Account Refresh Token:", account?.refresh_token ? "Present" : "Missing");
        console.log("=== SIGNIN CALLBACK END ===");
        
        authLogger.signIn(user.id || "unknown", account?.provider || "unknown", {
          email: user.email || undefined,
          name: user.name || undefined,
        });

        // Check if user exists in database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        console.log("DB User lookup result:", dbUser ? "Found" : "Not found");

        if (!dbUser && account) {
          // New user - will be created by PrismaAdapter
          console.log("Creating new user via PrismaAdapter");
          authLogger.userCreated(user.id || "unknown", account.provider, user.email || undefined);
        }

        // Store OAuth profile data for context
        // PrismaAdapter creates/updates the account before this callback completes
        if (account && profile && user.id) {
          try {
            // Build OAuth profile data object
            const oauthProfileData = {
              provider: account.provider,
              email: user.email || '',
              email_verified: (profile as any).email_verified,
              name: user.name || '',
              given_name: (profile as any).given_name,
              family_name: (profile as any).family_name,
              picture: user.image || (profile as any).picture,
              locale: (profile as any).locale,
              sub: (profile as any).sub,
              raw: profile
            };

            // Store OAuth profile data immediately
            // The PrismaAdapter runs BEFORE this callback, so the account already exists
            const updateResult = await prisma.account.updateMany({
              where: {
                userId: user.id,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
              data: {
                oauth_profile_data: oauthProfileData as any,
              },
            });
            
            console.log(`✅ [signIn] Stored OAuth profile data for ${account.provider} (updated ${updateResult.count} records)`);
          } catch (profileError) {
            console.error("❌ [signIn] Error storing OAuth profile data:", profileError);
            // Don't fail signin if profile storage fails
          }
        }

        // The PrismaAdapter will handle account creation
        console.log("signIn callback returning: true");
        return true;
      } catch (error) {
        console.error("=== SIGNIN CALLBACK ERROR ===");
        console.error("Error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
        console.error("=== SIGNIN CALLBACK ERROR END ===");
        
        authLogger.callbackError("signIn", error, {
          userId: user.id,
          provider: account?.provider,
        });
        
        // Return false to trigger error page with details
        return false;
      }
    },
    
    async jwt({ token, account, user, trigger }) {
      try {
        console.log("=== JWT CALLBACK START ===");
        console.log("Trigger:", trigger);
        console.log("Token:", JSON.stringify(token, null, 2));
        console.log("Account:", account ? JSON.stringify(account, null, 2) : "None");
        console.log("User:", user ? JSON.stringify(user, null, 2) : "None");
        
        // On sign in, add user info to token
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.provider = account.provider;
          
          console.log("Added account data to token");
          
          authLogger.accountLinked(
            user?.id || token.sub as string,
            account.provider,
            account.providerAccountId
          );
        }
        
        if (user) {
          token.userId = user.id;
          console.log("Added userId to token:", user.id);
        }
        
        // If token doesn't have userId (old token), try to get it from sub
        if (!token.userId && token.sub) {
          token.userId = token.sub;
          console.log("Migrated userId from sub:", token.sub);
          authLogger.warn("token_migration", {
            message: "Migrating token from sub to userId",
            sub: token.sub,
          });
        }
        
        // Validate token has required fields
        if (!token.userId && !token.sub) {
          console.error("Token missing both userId and sub!");
          authLogger.callbackError("jwt", new Error("Token missing userId and sub"), {
            trigger,
            hasAccount: !!account,
            hasUser: !!user,
          });
          throw new Error("Token missing userId and sub");
        }
        
        console.log("JWT callback returning token with userId:", token.userId);
        console.log("=== JWT CALLBACK END ===");
        
        authLogger.jwtCreated(token, trigger);
        return token;
      } catch (error) {
        console.error("=== JWT CALLBACK ERROR ===");
        console.error("Error:", error);
        console.error("=== JWT CALLBACK ERROR END ===");
        authLogger.callbackError("jwt", error, { trigger });
        throw error;
      }
    },
    
    async session({ session, token }) {
      try {
        console.log("=== SESSION CALLBACK START ===");
        console.log("Session:", JSON.stringify(session, null, 2));
        console.log("Token:", JSON.stringify(token, null, 2));
        
        // Database session strategy: token is undefined, user data is in session
        // JWT session strategy: token contains user data
        
        if (token) {
          // JWT strategy: Get userId from token
          const userId = token.userId || token.sub;
          console.log("JWT strategy - Extracted userId from token:", userId);
          
          if (!userId) {
            console.error("Token missing userId and sub!");
            authLogger.callbackError("session", new Error("Token missing userId"), {
              hasToken: true,
              hasUser: !!session.user,
            });
            throw new Error("Token missing userId");
          }
          
          if (session.user) {
            session.user.id = userId as string;
            console.log("Set session.user.id from token:", userId);
          }
        } else {
          // Database strategy: User data already in session
          console.log("Database strategy - User data already in session");
          
          if (!session.user?.id) {
            console.error("Session missing user.id!");
            authLogger.callbackError("session", new Error("Session missing user.id"), {
              hasToken: false,
              hasUser: !!session.user,
            });
            throw new Error("Session missing user.id");
          }
          
          console.log("Session already has user.id:", session.user.id);
        }
        
        console.log("Session callback returning session");
        console.log("=== SESSION CALLBACK END ===");
        
        authLogger.sessionCreated(session);
        return session;
      } catch (error) {
        console.error("=== SESSION CALLBACK ERROR ===");
        console.error("Error:", error);
        console.error("=== SESSION CALLBACK ERROR END ===");
        authLogger.callbackError("session", error, {
          hasToken: !!token,
        });
        throw error;
      }
    }
  },
  
  events: {
    async signIn({ user, account }) {
      try {
        console.log("🔔 [events.signIn] Sign-in event triggered", {
          userId: user.id,
          provider: account?.provider,
          email: user.email,
        });
        
        authLogger.info("signin_event", {
          userId: user.id,
          provider: account?.provider,
          email: user.email,
        });

        // Update last login time
        if (account) {
          await prisma.account.updateMany({
            where: {
              userId: user.id,
              provider: account.provider,
            },
            data: {
              lastLoginAt: new Date(),
            },
          });
          console.log("✅ [events.signIn] Updated lastLoginAt for", account.provider);
        }
      } catch (error) {
        console.error("❌ [events.signIn] Error:", error);
        authLogger.error(error, {
          event: "signIn",
          userId: user.id,
        });
      }
    },
  }
});
