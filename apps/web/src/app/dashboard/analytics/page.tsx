'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useUserProfile } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  RefreshCw,
  Circle,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
}

const mockPayments: Payment[] = [
  {
    id: 'pay_N4mB9x7K1Q',
    amount: 15000,
    payment_type: 'service_fee',
    status: 'completed',
    payment_method: 'upi',
    created_at: '2024-01-15T10:30:00Z',
    paid_at: '2024-01-15T10:31:00Z',
  },
  {
    id: 'pay_M3nC8y6J2R',
    amount: 8500,
    payment_type: 'commission',
    status: 'completed',
    payment_method: 'card',
    created_at: '2024-01-14T14:20:00Z',
    paid_at: '2024-01-14T14:22:00Z',
  },
  {
    id: 'pay_L2oD7z5K3S',
    amount: 12000,
    payment_type: 'bonus',
    status: 'pending',
    payment_method: 'bank_transfer',
    created_at: '2024-01-13T09:15:00Z',
  },
  {
    id: 'pay_K1pE6a4L4T',
    amount: 25000,
    payment_type: 'service_fee',
    status: 'processing',
    payment_method: 'upi',
    created_at: '2024-01-12T16:45:00Z',
  },
  {
    id: 'pay_J0qF5b3M5U',
    amount: 5000,
    payment_type: 'refund',
    status: 'refunded',
    payment_method: 'card',
    created_at: '2024-01-11T11:30:00Z',
    paid_at: '2024-01-11T11:35:00Z',
  },
  {
    id: 'pay_I9rG4c2N6V',
    amount: 18000,
    payment_type: 'service_fee',
    status: 'failed',
    payment_method: 'bank_transfer',
    created_at: '2024-01-10T08:20:00Z',
  },
  {
    id: 'pay_H8sH3d1O7W',
    amount: 7500,
    payment_type: 'commission',
    status: 'completed',
    payment_method: 'upi',
    created_at: '2024-01-09T13:10:00Z',
    paid_at: '2024-01-09T13:12:00Z',
  },
  {
    id: 'pay_G7tI2e0P8X',
    amount: 22000,
    payment_type: 'service_fee',
    status: 'completed',
    payment_method: 'card',
    created_at: '2024-01-08T15:25:00Z',
    paid_at: '2024-01-08T15:27:00Z',
  },
];

function PaymentsContent() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.status.toLowerCase() === filter.toLowerCase();
  });

  const loadPayments = async (agencyId: string) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

      const response = await fetch(`/api/agencies/${agencyId}/payments?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to load payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      toast.success('Payments refreshed successfully');
    } catch (err) {
      console.error('Error loading payments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      toast.error(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => loadPayments(agencyId),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            <Circle className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
            <RotateCcw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mr-10">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all payment transactions for your agency
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>
                View all payment transactions and their current status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => profile?.agency?.id && loadPayments(profile.agency.id)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground mt-2">
                {filter === 'all'
                  ? 'No payment transactions have been recorded yet.'
                  : `No ${filter} payments found. Try changing the filter.`}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-[300px]">Transaction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="cursor-pointer">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              Payment #{payment.id.slice(4).toUpperCase()}
                            </p>
                            {payment.payment_method && (
                              <p className="text-xs text-muted-foreground capitalize">
                                via {payment.payment_method.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {payment.payment_type.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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
