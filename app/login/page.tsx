import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginClient } from "./client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  
  // Already logged in
  if (session?.user) {
    redirect(params.callbackUrl || "/trips");
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <LoginClient 
        callbackUrl={params.callbackUrl}
        error={params.error}
      />
    </div>
  );
}
