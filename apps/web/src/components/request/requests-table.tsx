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
import { Spinner } from '@/components/ui/spinner';

// Icons
import { Mail, Phone, Calendar, Trash2, Loader2, User, ShieldAlert } from 'lucide-react';

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

  useEffect(() => {
    loadRequests();
  }, []);

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
        header: 'Customer Detail',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground leading-none mb-1 tracking-tight">
                {row.original.name}
              </span>
              <span className="text-[10px]  text-muted-foreground flex items-center gap-1 font-bold tracking-tighter">
                <Mail className="h-3 w-3" /> {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground/80 tracking-tight">
            <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
            {row.original.phone || '—'}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Requested On',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/40" />
            {new Date(row.original.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isDeleting = deletingId === row.original.id;
          return (
            <div className="flex justify-end pr-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-red-500 hover:text-white hover:bg-red-600 transition-all font-black text-[10px] uppercase tracking-widest gap-2 rounded-md border border-transparent hover:border-red-700 shadow-sm hover:shadow-red-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.original.id);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {isDeleting ? 'Removing' : 'Remove'}
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner className="text-primary" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black animate-pulse">
          Synchronizing Records
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-b">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="h-12 text-[10px] font-black text-muted-foreground uppercase tracking-widest py-4"
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
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-48">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <ShieldAlert className="h-8 w-8 mb-1" />
                    <p className="text-sm font-bold uppercase tracking-tight">
                      No incoming requests
                    </p>
                    <p className="text-xs italic">Your request queue is currently empty.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
