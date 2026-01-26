import { auth } from "@/auth";
import { ComponentsDemoClient } from "./client";

export default async function ComponentsDemoPage() {
  const session = await auth();

  return <ComponentsDemoClient session={session} />;
}
