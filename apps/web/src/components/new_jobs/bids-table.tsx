'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

// Shadcn UI Imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// Icons
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Info,
  IndianRupee,
  Timer,
} from 'lucide-react';

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
  is_job_assigned: boolean;
  job_assigned_to: string | null;
};

export function BidsListView() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  useEffect(() => {
    loadBids();
  }, []);

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
      loadBids();
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const columns: ColumnDef<Bid>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              {new Date(row.original.created_at).toLocaleDateString('en-GB')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Bidder',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none mb-1">{row.original.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider italic">
              {row.original.phone}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Bid Price',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm font-bold text-foreground">
            <IndianRupee className="h-3 w-3" />
            {row.original.price.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isAssigned = row.original.is_job_assigned;
          const isWinner = row.original.job_assigned_to === row.original.user_id;

          if (isAssigned && isWinner) {
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-md ring-1 ring-emerald-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Selected
              </Badge>
            );
          }
          if (isAssigned) {
            return (
              <Badge variant="secondary" className="rounded-md opacity-60">
                Closed
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="rounded-md border-amber-500/20 text-amber-600 bg-amber-50/50 uppercase text-[10px] font-bold"
            >
              <Timer className="mr-1 h-3 w-3" /> Pending
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: bids,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="p-32 flex flex-col items-center gap-4">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] font-bold uppercase tracking-widest py-3.5"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/20"
                  onClick={() => {
                    setSelectedBid(row.original);
                    setSheetOpen(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-muted-foreground italic"
                >
                  No bids currently submitted.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Details Sheet --- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto border-l-border/60 shadow-2xl p-0 flex flex-col">
          {selectedBid && (
            <>
              <SheetHeader className="p-6 border-b shrink-0 text-left">
                <div className="p-2 w-fit bg-primary/10 rounded-lg mb-2">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle className="text-xl font-black uppercase tracking-tight">
                  Bid Details
                </SheetTitle>
                <SheetDescription>Review the service partner's quote and profile.</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="py-8 space-y-8">
                  {/* Bidder Profile */}
                  <Section label="Service Partner">
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-border/40">
                      <div className="h-12 w-12 rounded-full border bg-background flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-black tracking-tight">
                          {selectedBid.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-primary/60">
                          Verified Partner
                        </span>
                      </div>
                    </div>
                  </Section>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 gap-3">
                    <DataBlock
                      icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                      label="Email Address"
                      value={selectedBid.email}
                    />
                    <DataBlock
                      icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                      label="Phone Number"
                      value={selectedBid.phone}
                    />
                    <DataBlock
                      icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                      label="Submission Date"
                      value={new Date(selectedBid.created_at).toLocaleDateString()}
                    />
                    <DataBlock
                      icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                      label="Reference ID"
                      value={`#${selectedBid.job_id.split('-')[0]}`}
                    />
                  </div>

                  <Separator />

                  {selectedBid.is_job_assigned && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        This job has already been assigned.
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Sticky Footer */}
              <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Quoted Amount
                    </span>
                    <span className="text-2xl font-black text-primary flex items-center">
                      <IndianRupee className="h-5 w-5 mr-0.5" />
                      {selectedBid.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      className="font-black uppercase text-[10px] tracking-widest px-8 h-12 shadow-lg shadow-primary/20"
                      onClick={handleAssign}
                      disabled={assigning || selectedBid.is_job_assigned}
                    >
                      {assigning ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      {selectedBid.is_job_assigned ? 'Assigned' : 'Assign Partner'}
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

// Sub-components
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
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
    <div className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:border-primary/30 transition-colors">
      <div className="p-2 bg-muted/40 rounded-md">{icon}</div>
      <div>
        <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
