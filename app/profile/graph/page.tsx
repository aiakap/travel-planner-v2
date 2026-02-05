/**
 * Profile Graph Page - Redirect
 * 
 * This page has been merged into the unified profile page.
 * Redirects to /profile#dossier for backward compatibility.
 */

import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting...",
  description: "Redirecting to profile page"
};

export default function ProfileGraphPage() {
  redirect("/profile#dossier");
}
