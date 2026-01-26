import { 
  UserProfile, 
  UserContact, 
  UserHobby, 
  UserTravelPreference,
  UserRelationship,
  ContactType,
  Hobby,
  TravelPreferenceType,
  TravelPreferenceOption,
  User,
  Account
} from "@/app/generated/prisma";

// Enhanced types with relations
export interface UserContactWithType extends UserContact {
  contactType: ContactType;
}

export interface UserHobbyWithDetails extends UserHobby {
  hobby: Hobby;
}

export interface UserTravelPreferenceWithDetails extends UserTravelPreference {
  preferenceType: TravelPreferenceType;
  option: TravelPreferenceOption | null;
}

export interface UserRelationshipWithUser extends UserRelationship {
  relatedUser: User;
}

// OAuth profile data structure
export interface OAuthProfileData {
  provider: string;
  email: string;
  email_verified?: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  sub?: string;
  // Raw profile data from OAuth provider
  raw: Record<string, any>;
}

// Complete user profile from database
export interface UserProfileData {
  basic: UserProfile | null;
  contacts: UserContactWithType[];
  hobbies: UserHobbyWithDetails[];
  travelPreferences: UserTravelPreferenceWithDetails[];
  relationships: UserRelationshipWithUser[];
}

// Profile graph summary
export interface ProfileGraphSummary {
  hasGraph: boolean;
  itemCount: number;
  categories: string[];
  lastUpdated: Date | null;
}

// Account information
export interface AccountInfo {
  provider: string;
  providerAccountId: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  scope?: string | null;
  lastLoginAt?: Date | null;
  oauth_profile_data?: OAuthProfileData | null;
}

// Complete user context
export interface UserContext {
  // User identity
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  
  // OAuth accounts
  accounts: AccountInfo[];
  
  // Primary OAuth profile (from Google or first provider)
  oauthProfile: OAuthProfileData | null;
  
  // Database profile
  profile: UserProfileData;
  
  // Profile graph
  profileGraph: ProfileGraphSummary;
  
  // Metadata
  lastFetched: Date;
  emailVerified: Date | null;
  createdAt: Date;
}

// Minimal user context for quick access (e.g., in session)
export interface MinimalUserContext {
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  hasProfile: boolean;
  hasGraph: boolean;
}

// Context for display in the modal
export interface UserContextDisplay {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    emailVerified: Date | null;
    createdAt: Date;
  };
  oauth: OAuthProfileData | null;
  accounts: AccountInfo[];
  profile: UserProfileData;
  graph: ProfileGraphSummary;
}
