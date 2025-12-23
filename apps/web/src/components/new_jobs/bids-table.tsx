'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { User, Mail, Phone, Calendar, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

// Updated type to match your API response
type Bid = {
  id: string;
  job_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  price: number;
  created_at: string;
  is_job_assigned: boolean; // From your API
  job_assigned_to: string | null; // From your API
};

export function BidsListView() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const columns: ColumnDef<Bid>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString('en-GB')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Bidder',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.original.name}</span>
            <span className="text-[11px] text-muted-foreground">{row.original.phone}</span>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Bid Price',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            ₹{row.original.price.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'is_job_assigned',
        header: 'Status',
        cell: ({ row }) => {
          const isAssigned = row.original.is_job_assigned;
          const isWinner = row.original.job_assigned_to === row.original.user_id;

          if (isAssigned && isWinner) {
            return (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-normal">
                Selected
              </Badge>
            );
          }
          if (isAssigned) {
            return (
              <Badge variant="outline" className="text-muted-foreground font-normal">
                Closed
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="font-normal text-amber-700 bg-amber-50">
              Pending
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground/30" />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: bids,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/jobs/bids');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setBids(data.bids ?? data);
    } catch (err: any) {
      toast.error(err.message || 'Error loading bids');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBid) return;
    try {
      setAssigning(true);
      const res = await fetch('/api/new/jobs/bids/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedBid.user_id,
          job_id: selectedBid.job_id,
          bid_id: selectedBid.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to assign');
      toast.success('Bid assigned successfully');
      setSheetOpen(false);
      loadBids(); // Refresh the list to update statuses
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Spinner className="h-6 w-6" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Loading Bids</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border overflow-hidden ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-b">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs font-semibold text-foreground">
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
                  className="cursor-pointer border-b last:border-0 "
                  onClick={() => {
                    setSelectedBid(row.original);
                    setSheetOpen(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No bids currently submitted.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="p-0 flex flex-col w-full sm:max-w-[500px]">
          {selectedBid && (
            <>
              <SheetHeader className="p-6 border-b shrink-0 text-left">
                <div className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-tighter">
                  BID ID: {selectedBid.id.split('-')[0]}
                </div>
                <SheetTitle className="text-xl font-semibold">Bid Submission Details</SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-8">
                  <Section label="Bidder Profile">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full border bg-slate-50 flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-medium">{selectedBid.name}</span>
                        <span className="text-xs text-muted-foreground tracking-wide">
                          Service Partner
                        </span>
                      </div>
                    </div>
                  </Section>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <DataBlock
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={selectedBid.email}
                    />
                    <DataBlock
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={selectedBid.phone}
                    />
                    <DataBlock
                      icon={<Calendar className="h-4 w-4" />}
                      label="Applied On"
                      value={new Date(selectedBid.created_at).toLocaleDateString()}
                    />
                    <DataBlock
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Job Reference"
                      value={`#${selectedBid.job_id.split('-')[0]}`}
                    />
                  </div>

                  <Separator />

                  {selectedBid.is_job_assigned && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        This job has already been assigned.
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 border-t shrink-0 ">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Quoted Amount
                    </span>
                    <span className="text-xl font-semibold text-foreground">
                      ₹{selectedBid.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={() => setSheetOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={assigning || selectedBid.is_job_assigned}
                      className="px-6 min-w-[140px]"
                    >
                      {assigning ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      {selectedBid.is_job_assigned ? 'Job Assigned' : 'Assign Partner'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Sub-components as defined before
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </h3>
      {children}
    </div>
  );
}

function DataBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
