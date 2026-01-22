"use server";

import { signIn, signOut } from "@/auth";

export const login = async (provider: string = "google", callbackUrl?: string) => {
  await signIn(provider, { redirectTo: callbackUrl || "/" });
};

export const logout = async () => {
  await signOut({ redirectTo: "/" });
};

// Login with specific provider
export const loginWithProvider = async (provider: string, callbackUrl?: string) => {
  await signIn(provider, { redirectTo: callbackUrl || "/manage" });
};
