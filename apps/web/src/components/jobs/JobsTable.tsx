'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Clock,
  MapPin,
  User,
  Wrench,
  DollarSign,
  Star,
  UserCheck,
  ChevronDownIcon,
  LinkIcon,
} from 'lucide-react';
import { Engineer, Job } from '@cueron/types';
import { useUserProfile } from '@/hooks';
import { toast } from 'sonner';
import { useRealtimeJobs } from '@/hooks';
import { useEffect } from 'react';
import { getJobStatusBadge } from '../shared/jobStatusBadge';
import { getJobUrgencyBadge } from '../shared/jobUrgencyBadge';
import { getJobTypeBadge } from '../shared/jobTypeBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '../ui/spinner';
import Link from 'next/link';

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export const JOB_URGENCY_OPTIONS = [
  { title: 'Emergency', value: 'emergency' },
  { title: 'Urgent', value: 'urgent' },
  { title: 'Normal', value: 'normal' },
  { title: 'Scheduled', value: 'scheduled' },
];

export const JOB_STATUS_OPTIONS = [
  { title: 'Pending', value: 'pending' },
  { title: 'Assigned', value: 'assigned' },
  { title: 'Accepted', value: 'accepted' },
  { title: 'Travelling', value: 'travelling' },
  { title: 'Onsite', value: 'onsite' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
];

export const JOB_TYPE_OPTIONS = [
  { title: 'AMC', value: 'AMC' },
  { title: 'Repair', value: 'Repair' },
  { title: 'Installation', value: 'Installation' },
  { title: 'Emergency', value: 'Emergency' },
] as const;

// Mock engineers data
// for now any (afterwards get these info to display)
const mockEngineers: any[] = [
  { id: 'eng-001', name: 'John Smith', skill_level: 5, available: true },
  { id: 'eng-002', name: 'Sarah Johnson', skill_level: 4, available: true },
  { id: 'eng-003', name: 'Mike Davis', skill_level: 3, available: false },
  { id: 'eng-004', name: 'Emily Brown', skill_level: 5, available: true },
  { id: 'eng-005', name: 'Robert Wilson', skill_level: 4, available: true },
];

// const mockJobs: Job[] = [
//   {
//     id: '1a2b3c4d-0000-0000-0000-000000000001',
//     job_number: 'J-2024-001',
//     client_id: 'client-uuid-001',
//     client_name: 'Acme Industries',
//     client_phone: '+1-555-1234',
//     job_type: 'Repair',
//     equipment_type: 'HVAC',
//     equipment_details: {
//       brand: 'Daikin',
//       model: 'DX20VC',
//       serial_number: 'SN12345',
//       capacity: '5 Ton',
//     },
//     issue_description: 'Unit not cooling properly.',
//     site_location: {
//       address: '123 Main St',
//       city: 'Metropolis',
//       state: 'NY',
//       pincode: '10001',
//       lat: 40.7128,
//       lng: -74.006,
//     },
//     assigned_agency_id: 'agency-uuid-001',
//     assigned_engineer_id: 'eng-001',
//     required_skill_level: 5,
//     scheduled_time: '2024-06-10T10:00:00Z',
//     urgency: 'urgent',
//     response_deadline: '2024-06-09T18:00:00Z',
//     status: 'assigned',
//     assigned_at: '2024-06-09T09:00:00Z',
//     accepted_at: '2024-06-09T10:00:00Z',
//     service_fee: 250,
//     payment_status: 'pending',
//     service_checklist: [
//       { item: 'Check compressor', completed: false },
//       { item: 'Inspect filters', completed: false },
//     ],
//     parts_used: [],
//     photos_before: [],
//     photos_after: [],
//     engineer_notes: '',
//     client_signature_url: '',
//     created_at: '2024-06-08T12:00:00Z',
//     updated_at: '2024-06-09T10:00:00Z',
//   },
//   {
//     id: '1a2b3c4d-0000-0000-0000-000000000002',
//     job_number: 'J-2024-002',
//     client_id: 'client-uuid-002',
//     client_name: 'Wayne Enterprises',
//     client_phone: '+1-555-5678',
//     job_type: 'Installation',
//     equipment_type: 'Generator',
//     equipment_details: {
//       brand: 'Cummins',
//       model: 'QSB7',
//       serial_number: 'SN67890',
//       capacity: '200 kW',
//     },
//     issue_description: 'Install new generator.',
//     site_location: {
//       address: '1007 Mountain Dr',
//       city: 'Gotham',
//       state: 'NJ',
//       pincode: '07001',
//       lat: 40.7128,
//       lng: -74.0059,
//     },
//     assigned_agency_id: 'agency-uuid-002',
//     assigned_engineer_id: undefined,
//     required_skill_level: 3,
//     scheduled_time: '2024-06-12T14:00:00Z',
//     urgency: 'scheduled',
//     response_deadline: '2024-06-11T18:00:00Z',
//     status: 'pending',
//     service_fee: 500,
//     payment_status: 'paid',
//     service_checklist: [],
//     parts_used: [],
//     photos_before: [],
//     photos_after: [],
//     engineer_notes: '',
//     client_signature_url: '',
//     client_rating: 5,
//     client_feedback: 'Excellent service!',
//     created_at: '2024-06-10T09:00:00Z',
//     updated_at: '2024-06-10T09:00:00Z',
//   },
// ];

export function DropdownCheckboxFilter({ label, options, selected, setSelected }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {label}
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Select {label}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={(checked) =>
              setSelected((prev) =>
                checked ? [...prev, opt.value] : prev.filter((v) => v !== opt.value)
              )
            }
          >
            {opt.title}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JobsTable() {
  const { user, profile, loading } = useUserProfile();
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    refresh,
  } = useRealtimeJobs(profile?.agency?.id);

  console.log(jobs);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    JOB_STATUS_OPTIONS.map((opt) => opt.value)
  );
  const [selectedUrgencies, setSelectedUrgencies] = useState<string[]>(
    JOB_URGENCY_OPTIONS.map((opt) => opt.value)
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    JOB_TYPE_OPTIONS.map((opt) => opt.value)
  );

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // const [assigning, setAssigning] = useState(false);
  // const [jobAssignments, setJobAssignments] = useState<Record<string, string>>({});
  // const [engineers, setEngineers] = useState<Engineer[]>([]);

  const filteredData = useMemo(() => {
    return jobs.filter((job) => {
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(job.job_type);
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(job.status);
      const matchUrgency =
        selectedUrgencies.length === 0 || selectedUrgencies.includes(job.urgency);
      return matchStatus && matchUrgency && matchType;
    });
  }, [jobs, selectedStatuses, selectedUrgencies, selectedTypes]);

  // const handleAssignEngineer = useCallback((jobId: string, engineerId: string) => {
  //   handleAssignEngineerFunction(jobId, engineerId);

  //   console.log(`Assigning engineer ${engineerId} to job ${jobId}`);
  // }, []);

  // async function handleAssignEngineerFunction(jobId: string, engineerId: string) {
  //   if (!engineerId) return;

  //   try {
  //     setAssigning(true);
  //     const response = await fetch(`/api/jobs/${jobId}/assign`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ engineer_id: engineerId }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error?.message || 'Failed to assign engineer');
  //     }

  //     // Show success message
  //     toast.success('Engineer assigned successfully');

  //     // Refresh the jobs list to get updated data
  //     await refresh();
  //   } catch (err) {
  //     console.error('Error assigning engineer:', err);
  //     toast.error(`Failed to assign engineer: ${(err as Error).message}`);
  //   } finally {
  //     setAssigning(false);
  //   }
  // }
  // const getEngineerName = useCallback((engineerId?: string) => {
  //   if (!engineerId) return null;
  //   const engineer = mockEngineers.find((e) => e.id === engineerId);
  //   return engineer?.name;
  // }, []);

  const columns = useMemo<ColumnDef<Job>[]>(
    () => [
      {
        accessorKey: 'job_number',
        header: 'Job #',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'client_name',
        header: 'Client',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'job_type',
        header: 'Type',
        cell: ({ row }) => getJobTypeBadge(row.original.job_type),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getJobStatusBadge(row.original.status),
      },
      {
        accessorKey: 'urgency',
        header: 'Urgency',
        cell: ({ row }) => getJobUrgencyBadge(row.original.urgency),
      },
      {
        accessorKey: 'scheduled_time',
        header: 'Scheduled',
        cell: ({ row }) =>
          row.original.scheduled_time
            ? new Date(row.original.scheduled_time).toLocaleString()
            : '-',
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Link href={`/dashboard/jobs/${row.original.job_number}`}>
            {' '}
            <Button size="icon" variant="ghost">
              <LinkIcon />
            </Button>
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const loadJobs = async () => {
    if (!profile?.agency?.id) return;

    try {
      const response = await fetch(`/api/agencies/${profile.agency.id}/jobs`);

      if (!response.ok) {
        toast.error('Failed to load jobs');
        throw new Error('Failed to load jobs');
        return;
      }

      const data: JobsResponse = await response.json();
    } catch (err) {
      console.error('Error loading jobs:', err);
      toast.error('Failed to load jobs');
      return;
    }
  };

  // const loadEngineers = async () => {
  //   try {
  //     const response = await fetch(`/api/agencies/${profile?.agency?.id}/engineers`);

  //     if (!response.ok) {
  //       throw new Error('Failed to load engineers');
  //     }
  //     const data = await response.json();

  //     setEngineers(data.engineers);
  //   } catch (err) {
  //     const errorMessage =
  //       err instanceof Error ? err.message : 'An error occurred while loading engineers';
  //     toast.error(errorMessage);
  //     return;
  //   }
  // };

  // place this correctly
  // useEffect(() => {
  //   if (user) {
  //     void loadEngineers();
  //   }
  // }, [user]);

  useEffect(() => {
    if (profile?.agency?.id) {
      void loadJobs();
    }
  }, [profile, loadJobs]);

  const handleRowClick = useCallback((job: Job, e: React.MouseEvent) => {
    // Don't open sheet if clicking on the select dropdown
    if ((e.target as HTMLElement).closest('[role="combobox"]')) {
      return;
    }
    setSelectedJob(job);
    setIsSheetOpen(true);
  }, []);

  if (loading && jobsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-4">
        <DropdownCheckboxFilter
          options={JOB_STATUS_OPTIONS}
          selected={selectedStatuses}
          setSelected={setSelectedStatuses}
          label="Status"
        />
        <DropdownCheckboxFilter
          options={JOB_URGENCY_OPTIONS}
          selected={selectedUrgencies}
          setSelected={setSelectedUrgencies}
          label="Urgency"
        />

        <DropdownCheckboxFilter
          options={JOB_TYPE_OPTIONS}
          selected={selectedTypes}
          setSelected={setSelectedTypes}
          label="Job Type"
        />
      </div>

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
                  onClick={(e) => handleRowClick(row.original, e)}
                  className="cursor-pointer"
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
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
