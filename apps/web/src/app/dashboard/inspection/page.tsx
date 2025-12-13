'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InspectionsListView } from '@/components/inspection/inspection-table';

function InspectionsContent() {
  return (
    <div className="container mx-auto p-6 space-y-4 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Inspections</h1>
        <p className="text-muted-foreground mt-1">View and manage inspections.</p>

        <div className="mt-5">
          <InspectionsListView />
        </div>
      </div>
    </div>
  );
}

export default function InspectionsPage() {
  return (
    <ProtectedRoute>
      <InspectionsContent />
    </ProtectedRoute>
  );
}
