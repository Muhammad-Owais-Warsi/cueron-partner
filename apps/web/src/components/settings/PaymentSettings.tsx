'use client';

/**
 * Payment Settings Component
 * 
 * Interface for managing payment-related settings including
 * viewing payment history and configuring payment preferences.
 * 
 * Requirements: 11.1
 */

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useAuth';

interface PaymentSummary {
  total_payments: number;
  pending_amount: number;
  completed_amount: number;
  last_payment_date?: string;
}

interface RecentPayment {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

export function PaymentSettings() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get agency ID from user profile
  const agencyId = profile?.agency?.id;

  useEffect(() => {
    if (profile && agencyId) {
      loadPaymentData();
    }
  }, [profile, agencyId]);

  const loadPaymentData = async () => {
    if (!agencyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/agencies/${agencyId}/payments`);
      
      if (!response.ok) {
        throw new Error('Failed to load payment data');
      }

      const data = await response.json();
      
      // Calculate summary
      const summary: PaymentSummary = {
        total_payments: data.payments?.length || 0,
        pending_amount: data.payments?.filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        completed_amount: data.payments?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        last_payment_date: data.payments?.find((p: any) => p.paid_at)?.paid_at,
      };
      
      setSummary(summary);
      setRecentPayments(data.payments?.slice(0, 5) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please select an agency to view payment settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Summary */}
      {summary && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Total Payments</div>
              <div className="text-2xl font-bold text-blue-900">{summary.total_payments}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">Pending Amount</div>
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(summary.pending_amount)}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">Completed Amount</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(summary.completed_amount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
          <a
            href="/dashboard/payments"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </a>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No payment records found</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.invoice_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paid_at || payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Configuration</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 mb-4">
            Configure your payment preferences and view payment history.
          </p>
          <div className="flex space-x-3">
            <a
              href="/dashboard/payments"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Payment History
            </a>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled
            >
              Configure Payment Methods
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}