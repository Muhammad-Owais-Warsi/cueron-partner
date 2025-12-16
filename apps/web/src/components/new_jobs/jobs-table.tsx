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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '../ui/label';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';

import { MapPin, Wrench, User, IndianRupee, AlertCircle, Hash } from 'lucide-react';

type Job = {
  id: string;
  location: string;
  photos: string[] | null;
  assigned: string | null;
  price: number | null;
  equipment_type: string;
  equipment_sl_no: string;
  poc_name: string;
  poc_phone: string;
  poc_email: string;
  problem_statement: string;
  possible_solution: string | null;
  created_at: string;
};

export function NewJobsListView() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    price: '',
  });

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[220px]">{row.original.location}</span>
          </div>
        ),
      },
      {
        accessorKey: 'equipment_type',
        header: 'Equipment',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.equipment_type}</div>
            <div className="text-xs text-muted-foreground">{row.original.equipment_sl_no}</div>
          </div>
        ),
      },
      {
        accessorKey: 'poc_name',
        header: 'POC',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.poc_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.poc_phone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'assigned',
        header: 'Assigned',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.assigned ?? 'Unassigned'}</Badge>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (row.original.price ? `₹ ${row.original.price}` : '—'),
      },
    ],
    []
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ----------------------------- Data Load ----------------------------- */

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/jobs');
      if (!res.ok) throw new Error('Failed to load jobs');

      const data = await res.json();
      console.log(data);
      setJobs(data.jobs ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setSheetOpen(true);
  };

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email || !applyForm.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selectedJob) return;

    try {
      const payload = {
        ...applyForm,
        price: applyForm.price ? Number(applyForm.price) : null,
        job_id: selectedJob.id,
      };

      const res = await fetch('/api/new/jobs/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit application');

      toast.success('Application submitted successfully');
      setApplyOpen(false);
      setApplyForm({ name: '', email: '', phone: '', price: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    }
  };

  const handleApplyChange = (key: string, value: string) => {
    setApplyForm((prev) => ({ ...prev, [key]: value }));
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
                  No jobs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ----------------------------- Job Sheet ----------------------------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[520px] overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle>Job Details</SheetTitle>
                <SheetDescription>Complete information for this job</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Detail icon={<Hash className="h-5 w-5" />} title="Job ID" value={selectedJob.id} />

                <Separator />

                <Detail
                  icon={<MapPin className="h-5 w-5" />}
                  title="Location"
                  value={selectedJob.location}
                />

                <Separator />

                <Detail
                  icon={<Wrench className="h-5 w-5" />}
                  title="Equipment"
                  value={
                    <>
                      <div>{selectedJob.equipment_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedJob.equipment_sl_no}
                      </div>
                    </>
                  }
                />

                <Separator />

                <Detail
                  icon={<AlertCircle className="h-5 w-5" />}
                  title="Problem"
                  value={
                    <>
                      <p>{selectedJob.problem_statement}</p>
                      {selectedJob.possible_solution && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          Possible solution: {selectedJob.possible_solution}
                        </p>
                      )}
                    </>
                  }
                />

                <Separator />

                <Detail
                  icon={<User className="h-5 w-5" />}
                  title="Point of Contact"
                  value={
                    <>
                      <div>{selectedJob.poc_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedJob.poc_phone} • {selectedJob.poc_email}
                      </div>
                    </>
                  }
                />

                <Separator />

                {!selectedJob.assigned && (
                  <div className="flex justify-end">
                    <Button onClick={() => setApplyOpen(true)}>Apply for Job</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ----------------------------- Apply Dialog ----------------------------- */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
            <DialogDescription>Enter your details to apply for this job.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={applyForm.name}
                onChange={(e) => handleApplyChange('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={applyForm.email}
                onChange={(e) => handleApplyChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={applyForm.phone}
                onChange={(e) => handleApplyChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Price (₹)</Label>
              <Input
                type="number"
                value={applyForm.price}
                onChange={(e) => handleApplyChange('price', e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <DialogFooter className="justify-start gap-2 pt-4">
            <Button variant="outline" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
