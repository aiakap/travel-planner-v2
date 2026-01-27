"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, Trash2, User, FileText, Network, 
  AlertTriangle, Loader2, CheckCircle 
} from "lucide-react";
import {
  searchUsers,
  getUserDetails,
  deleteUserProfile,
  deleteUserProfileGraph,
  deleteUserTrip,
  deleteAllUserTrips,
  deleteAllUserData
} from "@/lib/actions/admin-user-cleanup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserCleanupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Trip selection state
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedUser(null);
    
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError("No users found matching your query");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setLoading(true);
    setError(null);
    setSelectedTripIds(new Set()); // Clear trip selections
    
    try {
      const details = await getUserDetails(userId);
      setSelectedUser(details);
    } catch (err: any) {
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const toggleTripSelection = (tripId: string) => {
    setSelectedTripIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  const toggleAllTrips = () => {
    if (!selectedUser?.trips) return;
    
    if (selectedTripIds.size === selectedUser.trips.length) {
      // All selected, so deselect all
      setSelectedTripIds(new Set());
    } else {
      // Some or none selected, so select all
      setSelectedTripIds(new Set(selectedUser.trips.map((t: any) => t.id)));
    }
  };

  const confirmAction = (title: string, description: string, action: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, description, action });
  };

  const executeAction = async () => {
    if (!confirmDialog) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await confirmDialog.action();
      setSuccess("Action completed successfully");
      // Refresh user details
      if (selectedUser) {
        const updated = await getUserDetails(selectedUser.id);
        setSelectedUser(updated);
      }
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleDeleteProfile = () => {
    if (!selectedUser) return;
    confirmAction(
      "Delete Profile",
      `Are you sure you want to delete the profile for ${selectedUser.email}? This will remove personal information but keep trips and chat history.`,
      async () => { await deleteUserProfile(selectedUser.id); }
    );
  };

  const handleDeleteGraph = () => {
    if (!selectedUser) return;
    confirmAction(
      "Delete Profile Graph",
      `Are you sure you want to delete the profile graph for ${selectedUser.email}? This will remove all relational profile data.`,
      async () => { await deleteUserProfileGraph(selectedUser.id); }
    );
  };

  const handleDeleteSelectedTrips = async () => {
    if (!selectedUser || selectedTripIds.size === 0) return;
    
    const tripCount = selectedTripIds.size;
    const tripTitles = selectedUser.trips
      .filter((t: any) => selectedTripIds.has(t.id))
      .map((t: any) => t.title)
      .join(", ");
    
    confirmAction(
      `Delete ${tripCount} Trip${tripCount > 1 ? 's' : ''}`,
      `Are you sure you want to delete ${tripCount} trip${tripCount > 1 ? 's' : ''}?\n\n${tripTitles}\n\nThis will also delete all segments, reservations, and chats associated with ${tripCount > 1 ? 'these trips' : 'this trip'}. This action cannot be undone.`,
      async () => {
        const tripIds = Array.from(selectedTripIds);
        for (const tripId of tripIds) {
          await deleteUserTrip(tripId, selectedUser.id);
        }
        setSelectedTripIds(new Set()); // Clear selections after delete
      }
    );
  };

  const handleDeleteAllTrips = () => {
    if (!selectedUser) return;
    confirmAction(
      "Delete ALL Trips",
      `Are you sure you want to delete ALL ${selectedUser._count.trips} trips for ${selectedUser.email}? This will delete all segments, reservations, and associated chats. This action cannot be undone.`,
      async () => { await deleteAllUserTrips(selectedUser.id); }
    );
  };

  const handleDeleteAll = () => {
    if (!selectedUser) return;
    confirmAction(
      "NUCLEAR OPTION: Delete ALL User Data",
      `⚠️ EXTREME CAUTION: This will DELETE EVERYTHING for ${selectedUser.email}:\n- Profile & Profile Graph\n- All ${selectedUser._count.trips} trips\n- All segments & reservations\n- All ${selectedUser._count.conversations} conversations\n- All contacts, hobbies, and preferences\n\nTHIS CANNOT BE UNDONE!`,
      async () => { await deleteAllUserData(selectedUser.id); }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Data Cleanup</h2>
        <p className="text-muted-foreground">
          Search for users and selectively delete their data
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>
            Search by email or name to find a user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label>Search Results ({searchResults.length})</Label>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <Card 
                    key={user.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{user.name || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="flex gap-2">
                          {user.profile && <Badge variant="secondary">Profile</Badge>}
                          {user.profileGraph && <Badge variant="secondary">Graph</Badge>}
                          {user._count.trips > 0 && (
                            <Badge variant="secondary">{user._count.trips} trips</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Selected User Details & Actions */}
      {selectedUser && (
        <div className="space-y-4">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedUser.name || "No name"}
              </CardTitle>
              <CardDescription>{selectedUser.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trips:</span>
                  <span className="ml-2">{selectedUser._count.trips}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversations:</span>
                  <span className="ml-2">{selectedUser._count.conversations}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contacts:</span>
                  <span className="ml-2">{selectedUser._count.contacts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Data</CardTitle>
              <CardDescription>Delete profile or profile graph separately</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteProfile}
                  disabled={!selectedUser.profile || loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Delete Profile
                </Button>
                {!selectedUser.profile && (
                  <span className="text-sm text-muted-foreground self-center">No profile data</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteGraph}
                  disabled={!selectedUser.profileGraph || loading}
                >
                  <Network className="h-4 w-4 mr-2" />
                  Delete Profile Graph
                </Button>
                {!selectedUser.profileGraph && (
                  <span className="text-sm text-muted-foreground self-center">No graph data</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trips Actions */}
          {selectedUser.trips && selectedUser.trips.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trips ({selectedUser.trips.length})</CardTitle>
                    <CardDescription>
                      Select trips to delete ({selectedTripIds.size} selected)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleAllTrips}
                      disabled={loading}
                      size="sm"
                    >
                      {selectedTripIds.size === selectedUser.trips.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSelectedTrips}
                      disabled={loading || selectedTripIds.size === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedTripIds.size})
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAllTrips}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedUser.trips.map((trip: any) => (
                  <Card 
                    key={trip.id} 
                    className={`border-2 transition-colors ${
                      selectedTripIds.has(trip.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTripIds.has(trip.id)}
                          onCheckedChange={() => toggleTripSelection(trip.id)}
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{trip.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {trip._count.segments} segments • {trip._count.conversations} chats
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Nuclear Option */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently delete all user data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={loading}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete ALL User Data (Nuclear Option)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line">
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeAction} className="bg-destructive text-destructive-foreground">
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
