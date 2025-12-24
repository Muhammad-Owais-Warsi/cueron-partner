'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { NewJobsListView } from '@/components/new_jobs/jobs-table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

function JobsContent() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-6 pb-12 space-y-6">
        <div className="animate-in fade-in duration-500">
          <NewJobsListView />
        </div>
      </main>
    </div>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobsContent />
    </ProtectedRoute>
  );
}
