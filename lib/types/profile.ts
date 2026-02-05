/**
 * Profile Types
 * 
 * TypeScript interfaces for user profile data
 */

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  country: string | null;
  homeAirports: Airport[];
  preferredAirports: Airport[];
  loyaltyPrograms: Record<string, unknown> | null;
  gender: Gender | null;
  citizenship: string[] | null;        // Array of ISO country codes
  countryOfResidence: string | null;   // Single ISO country code
  createdAt: Date;
  updatedAt: Date;
}

export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export interface ContactType {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface UserContact {
  id: string;
  userId: string;
  contactTypeId: string;
  value: string;
  label: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  contactType: ContactType;
}

export interface Hobby {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  sortOrder: number;
}

export interface UserHobby {
  id: string;
  userId: string;
  hobbyId: string;
  level: string | null;
  notes: string | null;
  createdAt: Date;
  hobby: Hobby;
}

export interface TravelPreferenceType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sortOrder: number;
  options: TravelPreferenceOption[];
}

export interface TravelPreferenceOption {
  id: string;
  typeId: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface UserTravelPreference {
  id: string;
  userId: string;
  typeId: string;
  optionId: string;
  customValue: string | null;
  createdAt: Date;
  preferenceType: TravelPreferenceType;
  option: TravelPreferenceOption;
}

export interface UserRelationship {
  id: string;
  userId: string;
  relatedUserId: string;
  relationshipType: string;
  nickname: string | null;
  createdAt: Date;
  relatedUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface ProfileData {
  profile: UserProfile | null;
  contacts: UserContact[];
  hobbies: UserHobby[];
  travelPreferences: UserTravelPreference[];
  relationships: UserRelationship[];
}
