'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUserProfile } from '@/hooks/useAuth';
import { toast } from 'sonner';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  Search,
  ArrowUpDown,
  CreditCard,
  Clock,
  XCircle,
  RotateCcw,
  CheckCircle2Icon,
  LoaderIcon,
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
}

const mockPayments: Payment[] = [
  {
    id: 'pay_N4mB9x7K1Q',
    amount: 15000,
    payment_type: 'service_fee',
    status: 'completed',
    payment_method: 'upi',
    created_at: '2024-01-15T10:30:00Z',
    invoice_number: 'INV-001',
    paid_at: '2024-01-15T10:31:00Z',
  },
  {
    id: 'pay_L2oD7z5K3S',
    amount: 12000,
    payment_type: 'bonus',
    status: 'processing',
    payment_method: 'bank_transfer',
    created_at: '2024-01-13T09:15:00Z',
    invoice_number: 'INV-002',
  },
  {
    id: 'pay_I9rG4c2N6V',
    amount: 18000,
    payment_type: 'service_fee',
    status: 'failed',
    payment_method: 'bank_transfer',
    created_at: '2024-01-10T08:20:00Z',
    invoice_number: 'INV-003',
  },
];

export function PaymentsListView({ agencyId }: { agencyId?: string }) {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    loadPayments();
  }, [agencyId]);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/agencies/${agencyId}/payments`);

      if (!response.ok) {
        throw new Error('Failed to load payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      toast.success('Payments refreshed successfully');
    } catch (err) {
      console.error('Error loading payments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amt);

  const formatDate = (date: string | undefined) =>
    date ? new Date(date).toLocaleString('en-IN') : '—';

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed')
      return (
        <Badge className="text-green-600 bg-green-600/10">
          <CheckCircle2Icon className="w-3 h-3 mr-1" /> Completed
        </Badge>
      );
    if (s === 'pending')
      return (
        <Badge className="text-yellow-600 bg-yellow-600/10">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
    if (s === 'processing')
      return (
        <Badge className="text-blue-600 bg-blue-600/10">
          <LoaderIcon className="w-3 h-3 mr-1" /> Processing
        </Badge>
      );
    if (s === 'failed')
      return (
        <Badge className="text-red-600 bg-red-600/10">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    if (s === 'refunded')
      return (
        <Badge className="text-purple-600 bg-purple-600/10">
          <RotateCcw className="w-3 h-3 mr-1" /> Refunded
        </Badge>
      );
    return <Badge>{status}</Badge>;
  };

  const columns: ColumnDef<Payment>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: () => (
          <Button variant="ghost" className="h-auto p-0">
            Payment ID <ArrowUpDown className="h-4 w-4 ml-1" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: 'payment_type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.payment_type.replace('_', ' ')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => <span>{formatDate(row.original.created_at)}</span>,
      },
      {
        accessorKey: 'amount',
        header: () => (
          <Button variant="ghost" className="h-auto p-0">
            Amount <ArrowUpDown className="h-4 w-4 ml-1" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{formatAmount(row.original.amount)}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payment ID..."
            onChange={(e) => table.getColumn('id')?.setFilterValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          onValueChange={(value) => {
            if (value === 'all') table.getColumn('status')?.setFilterValue(undefined);
            else table.getColumn('status')?.setFilterValue(value);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[520px]">
          {selectedPayment && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </SheetTitle>
                <SheetDescription>
                  Full information about this payment transaction.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium">Payment ID</div>
                  <div>{selectedPayment.id}</div>
                </div>

                <div>
                  <div className="font-medium">Status</div>
                  {getStatusBadge(selectedPayment.status)}
                </div>

                <div>
                  <div className="font-medium">Amount</div>
                  {formatAmount(selectedPayment.amount)}
                </div>

                <div>
                  <div className="font-medium">Payment Method</div>
                  <div className="capitalize">{selectedPayment.payment_method || '—'}</div>
                </div>

                <div>
                  <div className="font-medium">Created At</div>
                  {formatDate(selectedPayment.created_at)}
                </div>

                <div>
                  <div className="font-medium">Paid At</div>
                  {formatDate(selectedPayment.paid_at)}
                </div>

                <div>
                  <div className="font-medium">Invoice Number</div>
                  {selectedPayment.invoice_number || '—'}
                </div>

                <div>
                  <div className="font-medium">Invoice Date</div>
                  {formatDate(selectedPayment.invoice_date)}
                </div>

                <div>
                  <div className="font-medium">Due Date</div>
                  {formatDate(selectedPayment.due_date)}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
