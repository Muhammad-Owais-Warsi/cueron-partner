'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RequestList } from '@/components/request/requests-table';

function RequestContent() {
  return (
    <div className="container mx-auto p-6 space-y-4 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Requests</h1>
        <p className="text-muted-foreground mt-1">View and manage requests.</p>

        <div className="mt-5">
          <RequestList />
        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <ProtectedRoute>
      <RequestContent />
    </ProtectedRoute>
  );
}
