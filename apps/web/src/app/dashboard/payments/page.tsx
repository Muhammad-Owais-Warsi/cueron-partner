'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useUserProfile } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

import { PaymentsListView } from '@/components/payment/page';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
}

function PaymentsContent() {
  const { profile, loading: profileLoading } = useUserProfile();

  const agencyId = profile?.agency?.id;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4 px-0 flex-1 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all payment transactions for your agency
        </p>

        <div className="mt-5">
          <PaymentsListView agencyId={agencyId} />
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <PaymentsContent />
    </ProtectedRoute>
  );
}

// <div className="space-y-1">
//   <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team Management</h1>
//   <p className="text-muted-foreground">
//     Manage your engineers, track availability, and monitor locations
//   </p>
// </div>
