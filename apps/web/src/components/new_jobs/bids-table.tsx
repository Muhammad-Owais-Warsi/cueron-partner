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

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { User, IndianRupee, Phone, Mail, Calendar, Briefcase } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type Bid = {
  id: string;
  job_id: string;
  user_id: string;

  name: string;
  email: string;
  phone: string;
  price: number;

  created_at: string;
};

/* -------------------------------------------------------------------------- */
/*                              Bids List View                                */
/* -------------------------------------------------------------------------- */

export function BidsListView() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* -------------------------------- Columns -------------------------------- */

  const columns: ColumnDef<Bid>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        accessorKey: 'name',
        header: 'Bidder',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.phone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Bid Price',
        cell: ({ row }) => (
          <Badge variant="outline">
            <IndianRupee className="h-3 w-3 mr-1" />
            {row.original.price}
          </Badge>
        ),
      },
      {
        accessorKey: 'job_id',
        header: 'Job',
        cell: () => <Badge variant="secondary">View</Badge>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: bids,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ------------------------------- Data Load ------------------------------- */

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/jobs/bids');

      if (!res.ok) throw new Error('Failed to load bids');

      const data = await res.json();
      setBids(data.bids ?? data);
    } catch (err: any) {
      toast.error(err.message || 'Error loading bids');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (bid: Bid) => {
    setSelectedBid(bid);
    setSheetOpen(true);
  };

  /* -------------------------------- Loading -------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="space-y-4">
      {/* ------------------------------- Table ------------------------------- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No bids found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ------------------------------ Bid Sheet ------------------------------ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[520px] overflow-y-auto">
          {selectedBid && (
            <>
              <SheetHeader>
                <SheetTitle>Bid Details</SheetTitle>
                <SheetDescription>Complete information for this bid</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Detail
                  icon={<User className="h-5 w-5" />}
                  title="Bidder"
                  value={selectedBid.name}
                />

                <Separator />

                <Detail
                  icon={<Mail className="h-5 w-5" />}
                  title="Email"
                  value={selectedBid.email}
                />

                <Separator />

                <Detail
                  icon={<Phone className="h-5 w-5" />}
                  title="Phone"
                  value={selectedBid.phone}
                />

                <Separator />

                <Detail
                  icon={<IndianRupee className="h-5 w-5" />}
                  title="Quoted Price"
                  value={`₹ ${selectedBid.price}`}
                />

                <Separator />

                <Detail
                  icon={<Briefcase className="h-5 w-5" />}
                  title="Job ID"
                  value={selectedBid.job_id}
                />

                <Separator />

                <Detail
                  icon={<Calendar className="h-5 w-5" />}
                  title="Applied On"
                  value={new Date(selectedBid.created_at).toLocaleString()}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Helper                                   */
/* -------------------------------------------------------------------------- */

function Detail({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}
