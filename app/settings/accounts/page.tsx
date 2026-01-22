import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getConnectedAccounts, 
  getAvailableProviders,
  getAccountStats 
} from "@/lib/actions/account-management-actions";
import { AccountsClient } from "./client";

export default async function AccountsSettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const [accounts, availableProviders, stats] = await Promise.all([
    getConnectedAccounts(),
    getAvailableProviders(),
    getAccountStats()
  ]);
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connected Accounts</h1>
        <p className="text-muted-foreground">
          Manage your login methods and social connections. You can log in with any connected account.
        </p>
      </div>
      
      <AccountsClient 
        accounts={accounts}
        availableProviders={availableProviders}
        stats={stats}
      />
    </div>
  );
}
