import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TripStructureBuilderClient } from "./client";

export default async function NewTripPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  return <TripStructureBuilderClient userId={session.user.id} />;
}
