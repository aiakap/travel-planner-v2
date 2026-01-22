"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Star } from "lucide-react";
import { disconnectProvider, setPrimaryAccount } from "@/lib/actions/account-management-actions";
import { ProviderIcon } from "@/components/provider-icon";
import type { ConnectedAccount } from "@/lib/actions/account-management-actions";

interface AccountsClientProps {
  accounts: ConnectedAccount[];
  availableProviders: string[];
  stats: any;
}

export function AccountsClient({ accounts, availableProviders, stats }: AccountsClientProps) {
  const [disconnectDialog, setDisconnectDialog] = useState<{ open: boolean; provider: string | null }>({
    open: false,
    provider: null
  });
  const [loading, setLoading] = useState(false);
  
  const handleDisconnect = async () => {
    if (!disconnectDialog.provider) return;
    
    setLoading(true);
    try {
      const result = await disconnectProvider(disconnectDialog.provider);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to disconnect account");
    } finally {
      setLoading(false);
      setDisconnectDialog({ open: false, provider: null });
    }
  };
  
  const handleSetPrimary = async (provider: string) => {
    setLoading(true);
    try {
      await setPrimaryAccount(provider);
    } catch (error) {
      alert("Failed to set primary account");
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnectProvider = async (provider: string) => {
    await signIn(provider, { callbackUrl: "/settings/accounts" });
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Accounts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{stats.disconnected || 0}</div>
                <div className="text-sm text-muted-foreground">Disconnected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Connected Accounts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Accounts ({accounts.length})</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You can log in with any of these accounts. At least one account must remain connected.
        </p>
        
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <ProviderIcon provider={account.provider} size={40} />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{account.provider}</span>
                      {account.isPrimaryLogin && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3" />
                          Primary
                        </Badge>
                      )}
                      {account.syncStatus === "active" ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-gray-400 border-gray-400">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {account.lastLoginAt && (
                      <div className="text-xs text-muted-foreground">
                        Last used: {new Date(account.lastLoginAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!account.isPrimaryLogin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(account.provider)}
                      disabled={loading}
                    >
                      Set as Primary
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDisconnectDialog({ open: true, provider: account.provider })}
                    disabled={loading || accounts.length <= 1}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Add More Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect additional accounts to improve your travel recommendations and have more login options.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableProviders.map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleConnectProvider(provider)}
              >
                <ProviderIcon provider={provider} size={32} />
                <span className="text-sm capitalize">{provider}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialog.open} onOpenChange={(open) => setDisconnectDialog({ open, provider: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to log in with your {disconnectDialog.provider} account.
              {accounts.length <= 1 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This is your only account. You must add another account before disconnecting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={accounts.length <= 1}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
