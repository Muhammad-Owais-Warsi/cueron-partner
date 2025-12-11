'use client';

// Add dynamic = 'force-client' to prevent static generation issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SurveysListView } from '@/components/surveys/surveysTable';
import { Spinner } from '@/components/ui/spinner';
import { useUserProfile } from '@/hooks';

function SurveysPageContent() {
  const { profile, loading } = useUserProfile();

  if (loading) {
    <Spinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-4 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Surveys</h1>
        <p className="text-muted-foreground mt-1">View and manage surveys for your agency</p>

        <div className="mt-5">
          <SurveysListView agencyId={profile?.agency?.id} />
        </div>
      </div>
    </div>
  );
}

export default function SurveysPage() {
  return (
    <ProtectedRoute>
      <SurveysPageContent />
    </ProtectedRoute>
  );
}
