'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BidsListView } from '@/components/new_jobs/bids-table';

function BidsContent() {
  return (
    <div className="container mx-auto p-6 space-y-4 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Bids</h1>
        <p className="text-muted-foreground mt-1">View and manage bids.</p>

        <div className="mt-5">
          <BidsListView />
        </div>
      </div>
    </div>
  );
}

export default function BidsPage() {
  return (
    <ProtectedRoute>
      <BidsContent />
    </ProtectedRoute>
  );
}
