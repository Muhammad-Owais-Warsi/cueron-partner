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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Icons
import {
  MapPin,
  Briefcase,
  FileText,
  Gavel,
  CheckCircle2,
  PlusCircle,
  IndianRupee,
  User,
  Mail,
  Phone,
  Timer,
  Cpu,
  Contact,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useUserProfile } from '@/hooks';

// --- Types ---
type Job = {
  id: string;
  location: string;
  assigned: { email: string } | null;
  price: number | null;
  equipment_type: string;
  equipment_sl_no: string;
  poc_name: string;
  poc_email: string;
  poc_phone: string;
  problem_statement: string;
  possible_solution?: string;
  created_at: string;
  bids: { id: string; price: number; user_id: string }[];
};

export function NewJobsListView() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'mine' | 'bids'>('all');

  // Modal/Sheet States
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUserProfile();
  const currentUserEmail = user?.email;

  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    price: '',
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/jobs');
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch (err) {
      toast.error('Failed to sync marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // --- Handlers ---
  const handleOpenBid = (e: React.MouseEvent, job: Job) => {
    // Stop propagation so clicking the button doesn't open the Row's Sheet
    e.stopPropagation();
    setSelectedJob(job);
    setApplyForm({
      name: user?.full_name || user?.name || '',
      email: user?.email || '',
      phone: '',
      price: job.price?.toString() || '',
    });
    setApplyOpen(true);
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleApply = async () => {
    const { name, email, phone, price } = applyForm;
    if (!name || !email || !phone || !price) return toast.error('All fields are required');

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/new/jobs/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...applyForm, job_id: selectedJob?.id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Your bid has been placed');
      setApplyOpen(false);
      loadJobs();
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (view === 'mine') return jobs.filter((j) => j.assigned?.email === currentUserEmail);
    if (view === 'bids') return jobs.filter((j) => j.bids && j.bids.length > 0);
    return jobs;
  }, [jobs, view, currentUserEmail]);

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        accessorKey: 'equipment_type',
        header: 'Equipment',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none mb-1">
              {row.original.equipment_type}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider italic">
              SN: {row.original.equipment_sl_no}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
            <MapPin className="h-3 w-3 shrink-0" />
            {row.original.location}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isMine = row.original.assigned?.email === currentUserEmail;
          const hasMyBid = row.original.bids && row.original.bids.length > 0;
          if (isMine)
            return (
              <Badge variant="default" className="rounded-md ring-1 ring-primary/20">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Assigned
              </Badge>
            );
          if (row.original.assigned)
            return (
              <Badge variant="secondary" className="rounded-md opacity-60">
                Claimed
              </Badge>
            );
          if (hasMyBid)
            return (
              <Badge
                variant="outline"
                className="rounded-md border-amber-500/20 text-amber-600 bg-amber-50/50 uppercase text-[10px] font-bold"
              >
                <Timer className="mr-1 h-3 w-3" /> Pending
              </Badge>
            );
          return (
            <Badge
              variant="outline"
              className="rounded-md border-emerald-500/20 text-emerald-600 bg-emerald-50/50 uppercase text-[10px] font-bold"
            >
              Open
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isAssigned = !!row.original.assigned;

          return (
            <div className="flex justify-end items-center gap-2">
              {!isAssigned && (
                <Button
                  className="font-bold uppercase text-[10px] tracking-widest h-8"
                  onClick={(e) => handleOpenBid(e, row.original)}
                >
                  Raise a bid
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUserEmail]
  );

  const table = useReactTable({
    data: filteredJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <div className="p-32 flex flex-col items-center gap-4">
        <Spinner className="text-primary" />
      </div>
    );
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Marketboard', val: jobs.length, icon: FileText, v: 'all' },
          {
            label: 'Assigned',
            val: jobs.filter((j) => j.assigned?.email === currentUserEmail).length,
            icon: Briefcase,
            v: 'mine',
          },
          {
            label: 'My Bids',
            val: jobs.filter((j) => j.bids?.length > 0).length,
            icon: Gavel,
            v: 'bids',
          },
        ].map((s) => (
          <Card
            key={s.v}
            className={`cursor-pointer transition-all border-border/60 ${view === s.v ? 'border-primary bg-primary/[0.02]' : ''}`}
            onClick={() => setView(s.v as any)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon
                className={`h-4 w-4 ${view === s.v ? 'text-primary' : 'text-muted-foreground/40'}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-black uppercase tracking-tight"> Marketplace </h2>
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full sm:w-[300px]">
          <TabsList className="grid grid-cols-3 w-full border">
            <TabsTrigger value="all" className="text-xs font-bold">
              All
            </TabsTrigger>
            <TabsTrigger value="mine" className="text-xs font-bold">
              Mine
            </TabsTrigger>
            <TabsTrigger value="bids" className="text-xs font-bold">
              Bids
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Table */}
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
                  onClick={() => handleViewDetails(row.original)}
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
                  className="h-40 text-center text-muted-foreground"
                >
                  No listings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Details Sheet --- */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto border-l-border/60 shadow-2xl">
          <SheetHeader className="border-b pb-6 mb-6">
            <div className="p-2 w-fit bg-primary/10 rounded-lg mb-2">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl font-black uppercase tracking-tight">
              Service Requirement
            </SheetTitle>
            <SheetDescription>
              Verify equipment and contact details before bidding.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {/* Price Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-primary/60">
                Estimated Budget
              </span>
              <span className="text-xl font-black text-primary flex items-center">
                <IndianRupee className="h-4 w-4 mr-1" /> {selectedJob?.price?.toLocaleString()}
              </span>
            </div>

            {/* Equipment Info */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Cpu className="h-3 w-3" /> Equipment Info
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Type</p>
                  <p className="font-bold">{selectedJob?.equipment_type}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    Serial Number
                  </p>
                  <p className="font-mono text-xs">{selectedJob?.equipment_sl_no}</p>
                </div>
              </div>
            </div>

            {/* Problem Statement */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3" /> Problem Statement
              </h4>
              <p className="text-sm leading-relaxed bg-muted/10 p-4 rounded-lg italic border-l-2 border-primary/40">
                "{selectedJob?.problem_statement}"
              </p>
            </div>

            {/* POC Section */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Contact className="h-3 w-3" /> Customer Contact
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-background border rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Name</p>
                    <p className="text-sm font-bold">{selectedJob?.poc_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background border rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Phone</p>
                    <p className="text-sm font-bold">{selectedJob?.poc_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- Bid Submission Dialog --- */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Submit Quotation
            </DialogTitle>
            <DialogDescription>Your details will be shared with the job creator.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={applyForm.name}
                    onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                Phone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  className="pl-9"
                  placeholder="+91"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-primary ml-1">
                Your Quote (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  type="number"
                  value={applyForm.price}
                  onChange={(e) => setApplyForm({ ...applyForm, price: e.target.value })}
                  className="pl-9 font-bold text-lg h-12 border-primary/30 bg-primary/5"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              className="font-bold px-8 shadow-lg shadow-primary/20"
              onClick={handleApply}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner className="mr-2" /> : 'Confirm Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
