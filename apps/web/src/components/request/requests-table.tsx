'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';

type Request = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
};

export function RequestList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/request');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.requests ?? data);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/new/request/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error();

      toast.success('Request deleted');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error('Failed to delete request');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Request>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Detail',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm tracking-tight">
              {row.original.name}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-foreground/80 font-medium">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {row.original.phone || 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Requested On',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(row.original.created_at).toLocaleDateString('en-GB')}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isDeleting = deletingId === row.original.id;
          return (
            <div className="flex justify-end items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium text-xs gap-2"
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          );
        },
      },
    ],
    [deletingId]
  );

  const table = useReactTable({
    data: requests,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Simplified loading state - just the spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner />
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold animate-pulse">
          Fetching records
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border  overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-b bg-muted/30">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="h-12 text-[11px] font-bold text-muted-foreground uppercase tracking-widest"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
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
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-40 text-muted-foreground text-sm italic"
                >
                  No pending requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
