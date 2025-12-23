'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EngineersRequestsList } from '@/components/request/requests-table';
import { TicketsListView } from '@/components/tickets/ticket-table';

function EngineersRequestContent() {
  return (
    <div className="container mx-auto p-6 space-y-4 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Tickets</h1>
        <p className="RequestList">View and manage tickets.</p>

        <div className="mt-5">
          <EngineersRequestsList />
        </div>
      </div>
    </div>
  );
}

export default function EngineersRequestPage() {
  return (
    <ProtectedRoute>
      <EngineersRequestContent />
    </ProtectedRoute>
  );
}
