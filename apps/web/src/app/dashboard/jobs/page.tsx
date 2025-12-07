'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { JobsTable } from '@/components/jobs';

function JobsPageContent() {
  return (
    <div className="container mx-auto p-6 space-y-4 px-0 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Jobs</h1>
        <p className="text-muted-foreground mt-1">
          View and manage job assignments for your agency
        </p>

        <div className="mt-5">
          <JobsTable />
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobsPageContent />
    </ProtectedRoute>
  );
}
