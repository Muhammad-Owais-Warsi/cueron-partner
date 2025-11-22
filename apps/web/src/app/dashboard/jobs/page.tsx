'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { JobsListView } from '@/components/jobs/JobsListView';

function JobsPageContent() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-600 mt-1">
          View and manage job assignments for your agency
        </p>
      </div>

      <JobsListView />
    </DashboardLayout>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobsPageContent />
    </ProtectedRoute>
  );
}
