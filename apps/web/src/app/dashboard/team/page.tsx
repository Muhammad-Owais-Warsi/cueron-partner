'use client';

/**
 * Team Management Page
 *
 * Displays engineers list with filtering, add engineer form,
 * and team map view with real-time locations.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.3
 */

import { useState } from 'react';
import { EngineersListView } from '@/components/team/EngineersListView';
import { TeamMapView } from '@/components/team/TeamMapView';
import { AddEngineerDialog } from '@/components/team/AddEngineerDialog';
import { BulkUploadDialog } from '@/components/team/BulkUploadDialog';
import { useUserProfile } from '@/hooks/useAuth';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, List, MapPin } from 'lucide-react';

type ViewMode = 'list' | 'map';

export default function TeamPage() {
  const { profile, loading } = useUserProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  let agencyId = null;
  if (profile?.agency?.id) {
    agencyId = profile.agency.id;
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3 justify-end">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your engineers, track availability, and monitor locations
          </p>
        </div>

        <div className="flex gap-3">
          <BulkUploadDialog agencyId={agencyId} />
          <AddEngineerDialog agencyId={agencyId} />
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <MapPin className="h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <EngineersListView key={refreshKey} agencyId={agencyId || undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Team Locations
              </CardTitle>
              <CardDescription>Real-time location tracking of your engineers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TeamMapView key={refreshKey} agencyId={agencyId || undefined} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
