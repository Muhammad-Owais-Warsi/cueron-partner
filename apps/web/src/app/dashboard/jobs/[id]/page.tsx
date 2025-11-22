'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { JobDetailView } from '@/components/jobs/JobDetailView';
import { createClient } from '@/lib/supabase/client';

function JobDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate job ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      setError('Invalid job ID');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [jobId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading job details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <JobDetailView jobId={jobId} />
    </DashboardLayout>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <JobDetailPageContent />
    </ProtectedRoute>
  );
}
