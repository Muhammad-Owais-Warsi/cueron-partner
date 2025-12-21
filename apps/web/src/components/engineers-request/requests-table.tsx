'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { CheckCircle } from 'lucide-react';

type EngineerRequest = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
};

export function EngineersRequestsList() {
  const [requests, setRequests] = useState<EngineerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<EngineerRequest | null>(null);
  const [approving, setApproving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* -------------------------------------------------- */
  /* Fetch requests */
  /* -------------------------------------------------- */
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/engineers/request');

      if (!res.ok) throw new Error('Failed to load requests');

      const data = await res.json();
      setRequests(data.requests ?? data);
    } catch (err) {
      toast.error('Failed to load engineer requests');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------- */
  /* Approve */
  /* -------------------------------------------------- */
  const approveEngineer = async () => {
    if (!selected) return;

    try {
      setApproving(true);

      const res = await fetch('/api/new/engineers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selected.user_id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }

      toast.success('Engineer approved');

      // remove from list
      setRequests((prev) => prev.filter((r) => r.user_id !== selected.user_id));

      setDialogOpen(false);
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApproving(false);
    }
  };

  /* -------------------------------------------------- */
  /* Table */
  /* -------------------------------------------------- */
  const columns: ColumnDef<EngineerRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Engineer',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Requested At',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: 'status',
        header: 'Status',
        cell: () => <Badge variant="secondary">Pending</Badge>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => {
              setSelected(row.original);
              setDialogOpen(true);
            }}
          >
            Approve
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: requests,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No pending requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* -------------------------------------------------- */}
      {/* Approve Dialog */}
      {/* -------------------------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Engineer</DialogTitle>
            <DialogDescription>
              This will create the engineer profile and grant platform access.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {selected.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selected.email}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={approving}>
              Cancel
            </Button>
            <Button onClick={approveEngineer} disabled={approving}>
              {approving ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
