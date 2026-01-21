"use server";

import { signIn, signOut } from "@/auth";

export const login = async (callbackUrl?: string) => {
  await signIn("github", { redirectTo: callbackUrl || "/" });
};

export const logout = async () => {
  await signOut({ redirectTo: "/" });
};
