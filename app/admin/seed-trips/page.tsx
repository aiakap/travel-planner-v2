'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, Loader2, CheckCircle, MapPin, Calendar, 
  Plane, Hotel, UtensilsCrossed, Ticket, AlertCircle 
} from 'lucide-react';
import { searchUsers } from '@/lib/actions/admin-user-cleanup';

type TripSize = 'large' | 'medium' | 'small' | 'micro';

interface TripSummary {
  title: string;
  duration: number;
  segmentCount: number;
  reservationCount: number;
  reservationsByType: Record<string, number>;
  reservationsByStatus: Record<string, number>;
}

interface GeneratedTrip {
  tripId: string;
  segmentIds: string[];
  reservationIds: string[];
  summary: TripSummary;
  generationTime: number;
}

const TRIP_CONFIGS = [
  {
    size: 'large' as TripSize,
    name: 'Grand European Tour',
    duration: '21 days',
    icon: '🌍',
    destinations: ['SF', 'Amsterdam', 'Paris', 'Tuscany'],
    description: 'Complete tour with all reservation types',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    size: 'medium' as TripSize,
    name: 'Paris & Tuscany Escape',
    duration: '10 days',
    icon: '🗼',
    destinations: ['SF', 'Paris', 'Tuscany'],
    description: 'Focused luxury experience',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    size: 'small' as TripSize,
    name: 'Amsterdam Long Weekend',
    duration: '5 days',
    icon: '🚲',
    destinations: ['SF', 'Amsterdam'],
    description: 'Quick city escape',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    size: 'micro' as TripSize,
    name: 'Paris Quick Visit',
    duration: '2 days',
    icon: '⚡',
    destinations: ['SF', 'Paris'],
    description: 'Whirlwind highlights',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
];

export default function SeedTripsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<TripSize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedTrips, setGeneratedTrips] = useState<Record<TripSize, GeneratedTrip | null>>({
    large: null,
    medium: null,
    small: null,
    micro: null,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedUser(null);
    setGeneratedTrips({ large: null, medium: null, small: null, micro: null });

    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No users found matching your query');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    setGeneratedTrips({ large: null, medium: null, small: null, micro: null });
  };

  const handleGenerateTrip = async (tripSize: TripSize) => {
    if (!selectedUser) return;

    setGenerating(tripSize);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/seed-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          tripSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trip');
      }

      setGeneratedTrips((prev) => ({
        ...prev,
        [tripSize]: data,
      }));

      setSuccess(`✅ Generated ${tripSize} trip: ${data.summary.title}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate trip');
    } finally {
      setGenerating(null);
    }
  };

  const handleDeleteAllTrips = async () => {
    if (!selectedUser) return;
    if (!confirm('Delete ALL trips for this user? This cannot be undone.')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/seed-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'delete-all',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete trips');
      }

      setSuccess(`🗑️ Deleted ${data.deletedCount} trip(s)`);
      setGeneratedTrips({ large: null, medium: null, small: null, micro: null });
    } catch (err: any) {
      setError(err.message || 'Failed to delete trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seed Trip Generator</h1>
        <p className="text-muted-foreground">
          Generate comprehensive test trips with real venues, flights, hotels, and activities.
          Perfect for testing, demos, and development.
        </p>
      </div>

      {/* User Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select User
          </CardTitle>
          <CardDescription>
            Search for a user by email or name to generate seed trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results:</Label>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="font-medium">{user.email}</div>
                  {user.name && <div className="text-sm text-muted-foreground">{user.name}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Selected:</strong> {selectedUser.email}
                {selectedUser.name && ` (${selectedUser.name})`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Trip Generation Buttons */}
      {selectedUser && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {TRIP_CONFIGS.map((config) => {
              const generated = generatedTrips[config.size];
              const isGenerating = generating === config.size;

              return (
                <Card key={config.size} className={`border-2 ${generated ? 'border-green-500' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        {config.name}
                      </span>
                      {generated && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{config.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.destinations.map((dest, i) => (
                          <Badge key={i} variant="outline" className={config.color}>
                            {dest}
                          </Badge>
                        ))}
                      </div>

                      {generated && (
                        <div className="pt-3 border-t space-y-2">
                          <div className="text-sm font-medium">Generated:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {generated.summary.segmentCount} segments
                            </div>
                            <div className="flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              {generated.summary.reservationCount} reservations
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Trip ID: {generated.tripId.slice(0, 8)}...
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleGenerateTrip(config.size)}
                        disabled={isGenerating || !!generating}
                        className="w-full"
                        variant={generated ? 'outline' : 'default'}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : generated ? (
                          'Regenerate'
                        ) : (
                          'Generate Trip'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Delete All Button */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDeleteAllTrips}
                disabled={loading}
                variant="destructive"
              >
                Delete All Trips for User
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">{success}</AlertDescription>
        </Alert>
      )}

      {/* Info Section */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Seed Trips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>
            These seed trips contain real venues with accurate coordinates, Google Place IDs,
            and realistic timing. They're perfect for:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Testing the full trip planning workflow</li>
            <li>Demonstrating features to stakeholders</li>
            <li>Developing new features with realistic data</li>
            <li>QA testing across different trip complexities</li>
          </ul>
          <p className="pt-2">
            <strong>Data Sources:</strong> All venues use real locations from Amsterdam, Paris,
            and Tuscany with accurate geocoordinates. Flight times and hotel details are realistic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
