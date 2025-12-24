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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Requires shadcn Tabs
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

import {
  MapPin,
  Wrench,
  User,
  IndianRupee,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  ArrowUpRight,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useUserProfile } from '@/hooks';

type Job = {
  id: string;
  location: string;
  photos: string[] | null;
  assigned: { email: string } | null;
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
  const [view, setView] = useState<'all' | 'mine'>('all');

  /**
   * IMPORTANT: Replace this string with your actual Auth Session data.
   * e.g., const { user } = useUser(); const currentUserEmail = user.email;
   */

  const { user } = useUserProfile();

  const currentUserEmail = user?.email;

  console.log(user);

  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    price: '',
  });

  // Client-side filtering logic
  const filteredJobs = useMemo(() => {
    if (view === 'all') return jobs;
    // Only show jobs where the assigned email matches the viewer's email
    return jobs.filter((job) => job.assigned?.email === currentUserEmail);
  }, [jobs, view, currentUserEmail]);

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {new Date(row.original.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {new Date(row.original.created_at).getFullYear()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-[200px]">
            <div className="p-1.5 bg-secondary rounded-md">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="truncate text-sm font-medium">{row.original.location}</span>
          </div>
        ),
      },
      {
        accessorKey: 'equipment_type',
        header: 'Equipment',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{row.original.equipment_type}</span>
            <Badge variant="outline" className="w-fit text-[10px] h-4 font-mono px-1">
              SN: {row.original.equipment_sl_no}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'assigned',
        header: 'Status',
        cell: ({ row }) => {
          const assignedEmail = row.original?.assigned?.email;
          const isMine = assignedEmail === currentUserEmail;

          if (assignedEmail) {
            return (
              <Badge
                className={
                  isMine
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }
              >
                {isMine ? 'Assigned to Me' : 'Assigned'}
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
              Open
            </Badge>
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Estimate',
        cell: ({ row }) => (
          <div className="font-mono font-medium text-primary">
            {row.original.price ? `₹${row.original.price.toLocaleString()}` : '—'}
          </div>
        ),
      },
      {
        id: 'actions',
        cell: () => <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />,
      },
    ],
    [currentUserEmail]
  );

  const table = useReactTable({
    data: filteredJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/jobs');
      if (!res.ok) throw new Error('Failed to load jobs');
      const data = await res.json();
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
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Spinner className="h-10 w-10 " />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Jobs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ">
        <div className="flex items-center gap-3"></div>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as 'all' | 'mine')}
          className="w-full md:w-[320px]"
        >
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="all" className="text-xs uppercase font-bold tracking-wider">
              All Jobs
            </TabsTrigger>
            <TabsTrigger
              value="mine"
              className="text-xs uppercase font-bold tracking-wider flex gap-2"
            >
              <Briefcase className="h-3.5 w-3.5" />
              My Jobs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] font-bold uppercase tracking-widest py-4"
                  >
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
                  className="cursor-pointer transition-colors hover:bg-muted/40 border-b last:border-0"
                  onClick={() => handleRowClick(row.original)}
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
                  className="h-48 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3 max-w-[300px] mx-auto">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/20" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {view === 'mine' ? 'No Assignments' : 'No Jobs Available'}
                      </p>
                      <p className="text-xs leading-relaxed">
                        {view === 'mine'
                          ? "You aren't assigned to any active jobs. Switch to 'All Jobs' to find new work."
                          : 'The service board is currently empty. Please check back later.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAILED VIEW SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col gap-0 border-l shadow-2xl">
          {selectedJob && (
            <>
              <div className="p-6 bg-primary/5 border-b space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-background font-mono text-[10px]">
                    ID: {selectedJob.id.split('-')[0]}
                  </Badge>
                  {selectedJob.assigned?.email === currentUserEmail && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-none h-5 px-2">
                      Your Assignment
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-2xl font-bold">{selectedJob.equipment_type}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-foreground/70">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted on{' '}
                  {new Date(selectedJob.created_at).toLocaleDateString(undefined, {
                    dateStyle: 'long',
                  })}
                </SheetDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  <Section title="Issue Details">
                    <div className="bg-muted/40 rounded-lg p-4 border border-border/50">
                      <p className="text-sm leading-relaxed text-foreground/90 italic">
                        "{selectedJob.problem_statement}"
                      </p>
                      {selectedJob.possible_solution && (
                        <div className="mt-4 pt-4 border-t border-dashed border-muted-foreground/30">
                          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
                            Suggested Fix
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedJob.possible_solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </Section>

                  <div className="grid grid-cols-2 gap-4">
                    <DetailCard
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={selectedJob.location}
                    />
                    <DetailCard
                      icon={<Wrench className="h-4 w-4" />}
                      label="Serial Number"
                      value={selectedJob.equipment_sl_no}
                    />
                  </div>

                  <Section title="Point of Contact">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {selectedJob.poc_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{selectedJob.poc_name}</p>
                          <p className="text-xs text-muted-foreground">Main Contact Person</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pl-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {selectedJob.poc_phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {selectedJob.poc_email}
                        </div>
                      </div>
                    </div>
                  </Section>

                  {selectedJob.assigned && (
                    <Section title="Assignment Status">
                      <div
                        className={`rounded-lg p-3 border flex items-center gap-3 ${
                          selectedJob.assigned.email === currentUserEmail
                            ? 'bg-blue-50 border-blue-100'
                            : 'bg-emerald-50 border-emerald-100'
                        }`}
                      >
                        <User
                          className={`h-4 w-4 ${
                            selectedJob.assigned.email === currentUserEmail
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }`}
                        />
                        <div>
                          <p
                            className={`text-xs font-medium ${
                              selectedJob.assigned.email === currentUserEmail
                                ? 'text-blue-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {selectedJob.assigned.email === currentUserEmail
                              ? 'You are assigned'
                              : 'Assigned To'}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              selectedJob.assigned.email === currentUserEmail
                                ? 'text-blue-900'
                                : 'text-emerald-900'
                            }`}
                          >
                            {selectedJob.assigned.email}
                          </p>
                        </div>
                      </div>
                    </Section>
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-card mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                      Job Price
                    </p>
                    <p className="text-2xl font-mono font-bold">
                      {selectedJob.price ? `₹${selectedJob.price.toLocaleString()}` : 'TBD'}
                    </p>
                  </div>
                  {!selectedJob.assigned && (
                    <Button
                      size="lg"
                      className="px-8 shadow-lg shadow-primary/20"
                      onClick={() => setApplyOpen(true)}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* APPLY DIALOG */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          {/* ... Dialog Content remains the same ... */}
          <DialogFooter className="sm:justify-between gap-2 mt-4">
            <Button variant="ghost" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="px-10">
              Confirm Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components stay the same
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
        {title}
        <div className="h-px flex-1 bg-border" />
      </h3>
      {children}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 text-primary mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}
