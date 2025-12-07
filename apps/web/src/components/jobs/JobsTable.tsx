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
} from 'lucide-react';

type UUID = string;
type Timestamp = string;
type JobType = 'Repair' | 'Installation' | 'Maintenance' | 'Inspection';
type JobUrgency = 'urgent' | 'scheduled';
type JobStatus = 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed';
type SkillLevel = 1 | 2 | 3 | 4 | 5;

interface EquipmentDetails {
  brand?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
}

interface Address {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

interface ChecklistItem {
  item: string;
  completed: boolean;
}

interface PartUsed {
  part_name: string;
  quantity: number;
  cost?: number;
}

interface Job {
  id: UUID;
  job_number: string;
  client_id?: UUID;
  client_name: string;
  client_phone: string;
  job_type: JobType;
  equipment_type: string;
  equipment_details?: EquipmentDetails;
  issue_description?: string;
  site_location: Address;
  assigned_agency_id?: UUID;
  assigned_engineer_id?: UUID;
  required_skill_level: SkillLevel;
  scheduled_time?: Timestamp;
  urgency: JobUrgency;
  response_deadline?: Timestamp;
  status: JobStatus;
  assigned_at?: Timestamp;
  accepted_at?: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  service_fee?: number;
  payment_status: PaymentStatus;
  service_checklist?: ChecklistItem[];
  parts_used?: PartUsed[];
  photos_before?: string[];
  photos_after?: string[];
  engineer_notes?: string;
  client_signature_url?: string;
  client_rating?: 1 | 2 | 3 | 4 | 5;
  client_feedback?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

interface Engineer {
  id: string;
  name: string;
  skill_level: number;
  available: boolean;
}

// Mock engineers data
const mockEngineers: Engineer[] = [
  { id: 'eng-001', name: 'John Smith', skill_level: 5, available: true },
  { id: 'eng-002', name: 'Sarah Johnson', skill_level: 4, available: true },
  { id: 'eng-003', name: 'Mike Davis', skill_level: 3, available: false },
  { id: 'eng-004', name: 'Emily Brown', skill_level: 5, available: true },
  { id: 'eng-005', name: 'Robert Wilson', skill_level: 4, available: true },
];

const mockJobs: Job[] = [
  {
    id: '1a2b3c4d-0000-0000-0000-000000000001',
    job_number: 'J-2024-001',
    client_id: 'client-uuid-001',
    client_name: 'Acme Industries',
    client_phone: '+1-555-1234',
    job_type: 'Repair',
    equipment_type: 'HVAC',
    equipment_details: {
      brand: 'Daikin',
      model: 'DX20VC',
      serial_number: 'SN12345',
      capacity: '5 Ton',
    },
    issue_description: 'Unit not cooling properly.',
    site_location: {
      address: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      pincode: '10001',
      lat: 40.7128,
      lng: -74.006,
    },
    assigned_agency_id: 'agency-uuid-001',
    assigned_engineer_id: 'eng-001',
    required_skill_level: 5,
    scheduled_time: '2024-06-10T10:00:00Z',
    urgency: 'urgent',
    response_deadline: '2024-06-09T18:00:00Z',
    status: 'assigned',
    assigned_at: '2024-06-09T09:00:00Z',
    accepted_at: '2024-06-09T10:00:00Z',
    service_fee: 250,
    payment_status: 'pending',
    service_checklist: [
      { item: 'Check compressor', completed: false },
      { item: 'Inspect filters', completed: false },
    ],
    parts_used: [],
    photos_before: [],
    photos_after: [],
    engineer_notes: '',
    client_signature_url: '',
    created_at: '2024-06-08T12:00:00Z',
    updated_at: '2024-06-09T10:00:00Z',
  },
  {
    id: '1a2b3c4d-0000-0000-0000-000000000002',
    job_number: 'J-2024-002',
    client_id: 'client-uuid-002',
    client_name: 'Wayne Enterprises',
    client_phone: '+1-555-5678',
    job_type: 'Installation',
    equipment_type: 'Generator',
    equipment_details: {
      brand: 'Cummins',
      model: 'QSB7',
      serial_number: 'SN67890',
      capacity: '200 kW',
    },
    issue_description: 'Install new generator.',
    site_location: {
      address: '1007 Mountain Dr',
      city: 'Gotham',
      state: 'NJ',
      pincode: '07001',
      lat: 40.7128,
      lng: -74.0059,
    },
    assigned_agency_id: 'agency-uuid-002',
    assigned_engineer_id: undefined,
    required_skill_level: 3,
    scheduled_time: '2024-06-12T14:00:00Z',
    urgency: 'scheduled',
    response_deadline: '2024-06-11T18:00:00Z',
    status: 'pending',
    service_fee: 500,
    payment_status: 'paid',
    service_checklist: [],
    parts_used: [],
    photos_before: [],
    photos_after: [],
    engineer_notes: '',
    client_signature_url: '',
    client_rating: 5,
    client_feedback: 'Excellent service!',
    created_at: '2024-06-10T09:00:00Z',
    updated_at: '2024-06-10T09:00:00Z',
  },
];

export function JobsTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [status, setStatus] = useState<string>('all');
  const [urgency, setUrgency] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [jobAssignments, setJobAssignments] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    return mockJobs.filter((job) => {
      const matchStatus = status === 'all' || job.status === status;
      const matchUrgency = urgency === 'all' || job.urgency === urgency;
      return matchStatus && matchUrgency;
    });
  }, [status, urgency]);

  const handleAssignEngineer = useCallback((jobId: string, engineerId: string) => {
    setJobAssignments((prev) => ({
      ...prev,
      [jobId]: engineerId,
    }));
    // Here you would typically make an API call to assign the engineer
    console.log(`Assigning engineer ${engineerId} to job ${jobId}`);
  }, []);

  const getEngineerName = useCallback((engineerId?: string) => {
    if (!engineerId) return null;
    const engineer = mockEngineers.find((e) => e.id === engineerId);
    return engineer?.name;
  }, []);

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
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'urgency',
        header: 'Urgency',
        cell: ({ row }) => {
          const isUrgent = row.original.urgency === 'urgent';
          return (
            <Badge variant={isUrgent ? 'destructive' : 'default'} className="gap-1 capitalize">
              {isUrgent ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {row.original.urgency}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'assigned_engineer_id',
        header: 'Assigned To',
        cell: ({ row }) => {
          const job = row.original;
          const currentEngineerId = jobAssignments[job.id] || job.assigned_engineer_id;
          const engineerName = getEngineerName(currentEngineerId);

          return (
            <Select
              value={currentEngineerId || 'unassigned'}
              onValueChange={(value) => {
                if (value !== 'unassigned') {
                  handleAssignEngineer(job.id, value);
                }
              }}
            >
              <SelectTrigger className="w-[160px]" onClick={(e) => e.stopPropagation()}>
                <SelectValue>
                  {engineerName ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3 w-3" />
                      {engineerName}
                    </div>
                  ) : (
                    'Select Engineer'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="text-gray-500">Unassigned</span>
                </SelectItem>
                {mockEngineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.id} disabled={!engineer.available}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{engineer.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Level {engineer.skill_level}
                        </Badge>
                        {!engineer.available && (
                          <Badge variant="secondary" className="text-xs">
                            Busy
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: 'scheduled_time',
        header: 'Scheduled',
        cell: ({ row }) =>
          row.original.scheduled_time
            ? new Date(row.original.scheduled_time).toLocaleString()
            : '-',
      },
    ],
    [jobAssignments, handleAssignEngineer, getEngineerName]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
  }, []);

  const handleUrgencyChange = useCallback((value: string) => {
    setUrgency(value);
  }, []);

  const handleRowClick = useCallback((job: Job, e: React.MouseEvent) => {
    // Don't open sheet if clicking on the select dropdown
    if ((e.target as HTMLElement).closest('[role="combobox"]')) {
      return;
    }
    setSelectedJob(job);
    setIsSheetOpen(true);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-4">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={urgency} onValueChange={handleUrgencyChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
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
                  className="cursor-pointer hover:bg-gray-50"
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

      {/* Sheet for Job Details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Job Details</SheetTitle>
            <SheetDescription>Complete information for {selectedJob?.job_number}</SheetDescription>
          </SheetHeader>

          {selectedJob && (
            <div className="mt-6 space-y-6">
              {/* Job Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Job Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Number:</span>
                    <span className="font-medium">{selectedJob.job_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium">{selectedJob.job_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipment Type:</span>
                    <span className="font-medium">{selectedJob.equipment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required Skill Level:</span>
                    <span className="font-medium">{selectedJob.required_skill_level}/5</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedJob.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Urgency:</span>
                    <Badge
                      variant={selectedJob.urgency === 'urgent' ? 'destructive' : 'default'}
                      className="gap-1 capitalize"
                    >
                      {selectedJob.urgency === 'urgent' ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {selectedJob.urgency}
                    </Badge>
                  </div>
                  {selectedJob.issue_description && (
                    <div className="pt-2">
                      <span className="text-gray-600 block mb-1">Issue Description:</span>
                      <p className="text-gray-900">{selectedJob.issue_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipment Details */}
              {selectedJob.equipment_details && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Equipment Details</h3>
                  <div className="space-y-2 text-sm">
                    {selectedJob.equipment_details.brand && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium">{selectedJob.equipment_details.brand}</span>
                      </div>
                    )}
                    {selectedJob.equipment_details.model && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{selectedJob.equipment_details.model}</span>
                      </div>
                    )}
                    {selectedJob.equipment_details.serial_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serial Number:</span>
                        <span className="font-medium">
                          {selectedJob.equipment_details.serial_number}
                        </span>
                      </div>
                    )}
                    {selectedJob.equipment_details.capacity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">
                          {selectedJob.equipment_details.capacity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Client Information */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Client Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedJob.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedJob.client_phone}</span>
                  </div>
                </div>
              </div>

              {/* Site Location */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Site Location</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">Address:</span>
                    <span className="font-medium">
                      {selectedJob.site_location.address}
                      <br />
                      {selectedJob.site_location.city}, {selectedJob.site_location.state}{' '}
                      {selectedJob.site_location.pincode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {selectedJob.scheduled_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.scheduled_time).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.response_deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Deadline:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.response_deadline).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.assigned_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned At:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.assigned_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.accepted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accepted At:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.accepted_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.started_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started At:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed At:</span>
                      <span className="font-medium">
                        {new Date(selectedJob.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Financial</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {selectedJob.service_fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee:</span>
                      <span className="font-medium">${selectedJob.service_fee}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge
                      variant={
                        selectedJob.payment_status === 'paid'
                          ? 'default'
                          : selectedJob.payment_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {selectedJob.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Service Checklist */}
              {selectedJob.service_checklist && selectedJob.service_checklist.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Service Checklist</h3>
                  <div className="space-y-2">
                    {selectedJob.service_checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts Used */}
              {selectedJob.parts_used && selectedJob.parts_used.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Parts Used</h3>
                  <div className="space-y-2 text-sm">
                    {selectedJob.parts_used.map((part, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">
                          {part.part_name} (x{part.quantity})
                        </span>
                        {part.cost && <span className="font-medium">${part.cost}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engineer Notes */}
              {selectedJob.engineer_notes && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Engineer Notes</h3>
                  <p className="text-sm text-gray-900">{selectedJob.engineer_notes}</p>
                </div>
              )}

              {/* Client Rating */}
              {selectedJob.client_rating && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Client Rating</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedJob.client_rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {selectedJob.client_feedback && (
                      <p className="text-sm text-gray-900 mt-2">{selectedJob.client_feedback}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
