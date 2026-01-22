"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProviderIcon } from "@/components/provider-icon";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface LoginClientProps {
  callbackUrl?: string;
  error?: string;
}

const providers = [
  { id: "google", name: "Google", recommended: true },
  { id: "facebook", name: "Facebook", recommended: false },
  { id: "apple", name: "Apple", recommended: false },
  { id: "twitter", name: "X (Twitter)", recommended: false },
  { id: "spotify", name: "Spotify", recommended: false },
  { id: "linkedin", name: "LinkedIn", recommended: false },
  { id: "github", name: "GitHub", recommended: false },
];

export function LoginClient({ callbackUrl, error }: LoginClientProps) {
  const handleSignIn = async (providerId: string) => {
    await signIn(providerId, { callbackUrl: callbackUrl || "/trips" });
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Ntourage Travel</CardTitle>
        <CardDescription>
          Sign in with any of your accounts to get personalized travel recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error === "OAuthAccountNotLinked" 
                ? "This account is already linked to another user."
                : "An error occurred during sign in. Please try again."}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleSignIn(provider.id)}
            >
              <ProviderIcon provider={provider.id} size={20} />
              <span className="flex-1 text-left">Continue with {provider.name}</span>
              {provider.recommended && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </Badge>
              )}
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-center text-muted-foreground pt-4">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
        </div>
      </CardContent>
    </Card>
  );
}
