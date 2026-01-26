"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Check, 
  ChevronDown, 
  User, 
  Database, 
  Network,
  RefreshCw,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Heart,
  Plane,
  Users
} from "lucide-react";
import { UserContextDisplay } from "@/lib/types/user-context";

interface UserContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserContextModal({ isOpen, onClose }: UserContextModalProps) {
  const [context, setContext] = useState<UserContextDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchContext(); // Always fetch when modal opens to ensure fresh data
    }
  }, [isOpen]);

  const fetchContext = async () => {
    console.log('🔄 [UserContextModal] Fetching fresh user context...');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user-context', {
        cache: 'no-store', // Ensure no caching at browser level
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user context');
      }
      const data = await response.json();
      console.log('✅ [UserContextModal] Context received:', {
        hasOAuth: !!data.oauth,
        hasProfile: !!data.profile?.basic,
        hasGraph: data.graph?.hasGraph,
        accountsCount: data.accounts?.length || 0,
        contactsCount: data.profile?.contacts?.length || 0,
        hobbiesCount: data.profile?.hobbies?.length || 0,
      });
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ [UserContextModal] Error fetching context:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Context
          </DialogTitle>
          <DialogDescription>
            Complete information collected about your account
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContext}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        {loading && !context && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {context && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="oauth">OAuth</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="graph">Graph</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {/* User Identity */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      {context.user.image ? (
                        <img 
                          src={context.user.image} 
                          alt={context.user.name || 'User'} 
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{context.user.name || 'No name set'}</h3>
                        <p className="text-sm text-muted-foreground">{context.user.email}</p>
                      </div>
                    </div>
                    <Badge variant={context.user.emailVerified ? 'default' : 'secondary'}>
                      {context.user.emailVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <code className="ml-2 text-xs">{context.user.id}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="ml-2">{new Date(context.user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    icon={<Network className="w-4 h-4" />}
                    label="OAuth Accounts"
                    value={context.accounts.length}
                  />
                  <StatCard 
                    icon={<Phone className="w-4 h-4" />}
                    label="Contacts"
                    value={context.profile.contacts.length}
                  />
                  <StatCard 
                    icon={<Heart className="w-4 h-4" />}
                    label="Hobbies"
                    value={context.profile.hobbies.length}
                  />
                  <StatCard 
                    icon={<Database className="w-4 h-4" />}
                    label="Graph Items"
                    value={context.graph.itemCount}
                  />
                </div>

                {/* OAuth Providers */}
                {context.accounts.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Connected Accounts</h4>
                    <div className="space-y-2">
                      {context.accounts.map((account, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {account.provider}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {account.lastLoginAt 
                                ? `Last login: ${new Date(account.lastLoginAt).toLocaleString()}`
                                : 'Never logged in'}
                            </span>
                          </div>
                          {account.oauth_profile_data && (
                            <Badge variant="secondary" className="text-xs">
                              Profile Data
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* OAuth Tab */}
            <TabsContent value="oauth" className="space-y-4">
              {context.oauth ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">OAuth Profile Data</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatJSON(context.oauth), 'oauth')}
                    >
                      {copiedSection === 'oauth' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <InfoRow label="Provider" value={context.oauth.provider} />
                    <InfoRow label="Email" value={context.oauth.email} />
                    <InfoRow 
                      label="Email Verified" 
                      value={context.oauth.email_verified ? 'Yes' : 'No'}
                      badge={context.oauth.email_verified}
                    />
                    <InfoRow label="Name" value={context.oauth.name} />
                    {context.oauth.given_name && (
                      <InfoRow label="Given Name" value={context.oauth.given_name} />
                    )}
                    {context.oauth.family_name && (
                      <InfoRow label="Family Name" value={context.oauth.family_name} />
                    )}
                    {context.oauth.locale && (
                      <InfoRow label="Locale" value={context.oauth.locale} />
                    )}
                    {context.oauth.sub && (
                      <InfoRow label="Subject (sub)" value={context.oauth.sub} code />
                    )}
                  </div>

                  <CollapsibleSection title="Raw Profile Data">
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {formatJSON(context.oauth.raw)}
                    </pre>
                  </CollapsibleSection>
                </div>
              ) : (
                <EmptyState message="No OAuth profile data available" />
              )}

              {context.accounts.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">All Accounts</h3>
                  {context.accounts.map((account, idx) => (
                    <CollapsibleSection 
                      key={idx} 
                      title={`${account.provider} Account`}
                      badge={account.lastLoginAt ? 'Active' : 'Inactive'}
                    >
                      <div className="space-y-2">
                        <InfoRow label="Provider ID" value={account.providerAccountId} code />
                        <InfoRow 
                          label="Access Token" 
                          value={account.access_token ? 'Present' : 'Not available'} 
                        />
                        <InfoRow 
                          label="Refresh Token" 
                          value={account.refresh_token ? 'Present' : 'Not available'} 
                        />
                        {account.expires_at && (
                          <InfoRow 
                            label="Expires" 
                            value={new Date(account.expires_at * 1000).toLocaleString()} 
                          />
                        )}
                        {account.scope && (
                          <InfoRow label="Scope" value={account.scope} />
                        )}
                      </div>
                    </CollapsibleSection>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              {context.profile.basic ? (
                <>
                  <div className="p-4 border rounded-lg space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Basic Information
                    </h3>
                    <div className="grid gap-2">
                      {context.profile.basic.firstName && (
                        <InfoRow label="First Name" value={context.profile.basic.firstName} />
                      )}
                      {context.profile.basic.lastName && (
                        <InfoRow label="Last Name" value={context.profile.basic.lastName} />
                      )}
                      {context.profile.basic.dateOfBirth && (
                        <InfoRow 
                          label="Date of Birth" 
                          value={new Date(context.profile.basic.dateOfBirth).toLocaleDateString()} 
                        />
                      )}
                      {context.profile.basic.city && (
                        <InfoRow 
                          label="Location" 
                          value={`${context.profile.basic.city}${context.profile.basic.country ? `, ${context.profile.basic.country}` : ''}`} 
                        />
                      )}
                    </div>
                  </div>

                  {context.profile.basic.homeAirports && (
                    <CollapsibleSection title="Home Airports" icon={<Plane className="w-4 h-4" />}>
                      <pre className="text-sm">{formatJSON(context.profile.basic.homeAirports)}</pre>
                    </CollapsibleSection>
                  )}

                  {context.profile.basic.loyaltyPrograms && (
                    <CollapsibleSection title="Loyalty Programs" icon={<Badge className="w-4 h-4" />}>
                      <pre className="text-sm">{formatJSON(context.profile.basic.loyaltyPrograms)}</pre>
                    </CollapsibleSection>
                  )}
                </>
              ) : (
                <EmptyState message="No profile information set" />
              )}

              {context.profile.contacts.length > 0 && (
                <CollapsibleSection 
                  title={`Contacts (${context.profile.contacts.length})`}
                  icon={<Phone className="w-4 h-4" />}
                >
                  <div className="space-y-2">
                    {context.profile.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{contact.contactType.label}:</span>
                          <span className="ml-2">{contact.value}</span>
                        </div>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {context.profile.hobbies.length > 0 && (
                <CollapsibleSection 
                  title={`Hobbies (${context.profile.hobbies.length})`}
                  icon={<Heart className="w-4 h-4" />}
                >
                  <div className="flex flex-wrap gap-2">
                    {context.profile.hobbies.map((hobby) => (
                      <Badge key={hobby.id} variant="outline">
                        {hobby.hobby.name} {hobby.level && `(${hobby.level})`}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {context.profile.travelPreferences.length > 0 && (
                <CollapsibleSection 
                  title={`Travel Preferences (${context.profile.travelPreferences.length})`}
                  icon={<Plane className="w-4 h-4" />}
                >
                  <div className="space-y-2">
                    {context.profile.travelPreferences.map((pref) => (
                      <div key={pref.id} className="p-2 bg-muted rounded">
                        <span className="font-medium">{pref.preferenceType.name}:</span>
                        <span className="ml-2">{pref.option?.value || pref.customValue || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {context.profile.relationships.length > 0 && (
                <CollapsibleSection 
                  title={`Relationships (${context.profile.relationships.length})`}
                  icon={<Users className="w-4 h-4" />}
                >
                  <div className="space-y-2">
                    {context.profile.relationships.map((rel) => (
                      <div key={rel.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                        {rel.relatedUser.image ? (
                          <img 
                            src={rel.relatedUser.image} 
                            alt={rel.relatedUser.name || ''} 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{rel.relatedUser.name}</div>
                          <div className="text-sm text-muted-foreground">{rel.relationshipType}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </TabsContent>

            {/* Graph Tab */}
            <TabsContent value="graph" className="space-y-4">
              {context.graph.hasGraph ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                      icon={<Database className="w-4 h-4" />}
                      label="Total Items"
                      value={context.graph.itemCount}
                    />
                    <StatCard 
                      icon={<Network className="w-4 h-4" />}
                      label="Categories"
                      value={context.graph.categories.length}
                    />
                  </div>

                  {context.graph.lastUpdated && (
                    <div className="p-3 bg-muted rounded flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      Last updated: {new Date(context.graph.lastUpdated).toLocaleString()}
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {context.graph.categories.map((category, idx) => (
                        <Badge key={idx} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <a href="/profile/graph">View Full Graph</a>
                  </Button>
                </>
              ) : (
                <EmptyState 
                  message="No profile graph data yet" 
                  action={
                    <Button variant="outline" asChild>
                      <a href="/profile/graph">Create Graph</a>
                    </Button>
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  code = false,
  badge = false 
}: { 
  label: string; 
  value: string; 
  code?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {code ? (
        <code className="text-sm bg-muted px-2 py-1 rounded">{value}</code>
      ) : badge ? (
        <Badge variant="default">{value}</Badge>
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  );
}

function CollapsibleSection({ 
  title, 
  children,
  icon,
  badge
}: { 
  title: string; 
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-4 border rounded-lg">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Database className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}
