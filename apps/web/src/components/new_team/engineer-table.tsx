'use client';

/**
 * Engineers List View Component
 *
 * Displays paginated list of engineers with search and filtering capabilities.
 * Shows engineer details, certifications, ratings, and availability status.
 *
 * Requirements: 2.1, 2.2, 2.5
 */

import { useState, useEffect, useMemo } from 'react';
import type { Engineer } from '@cueron/types';
import { useUserProfile } from '@/hooks/useAuth';
import { toast } from 'sonner';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
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
import { Separator } from '@/components/ui/separator';

import {
  Search,
  Star,
  Phone,
  Mail,
  ArrowUpDown,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface EngineersListViewProps {
  agencyId?: string;
}

export function EngineersListView({ agencyId: propAgencyId }: EngineersListViewProps) {
  const { profile: userProfile } = useUserProfile();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get agency ID from props or user profile
  const effectiveAgencyId = propAgencyId || userProfile?.agency?.id || null;

  // Define columns for the engineers table
  const columns: ColumnDef<Engineer>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Engineer
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const engineer = row.original;
          return (
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={engineer.photo_url} alt={engineer.name} />
                <AvatarFallback>
                  {engineer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium leading-none">{engineer.name}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {engineer.phone && (
                    <div className="flex items-center">
                      <Phone className="mr-1 h-3 w-3" />
                      <span>{engineer.phone}</span>
                    </div>
                  )}
                  {engineer.email && (
                    <div className="flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      <span>{engineer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'availability_status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('availability_status') as string;
          const statusConfig = {
            available: {
              label: 'Available',
              variant: 'default' as const,
              className: 'bg-green-100 text-green-800',
            },
            on_job: {
              label: 'On Job',
              variant: 'secondary' as const,
              className: 'bg-blue-100 text-blue-800',
            },
            offline: {
              label: 'Offline',
              variant: 'outline' as const,
              className: 'bg-gray-100 text-gray-800',
            },
            on_leave: {
              label: 'On Leave',
              variant: 'outline' as const,
              className: 'bg-yellow-100 text-yellow-800',
            },
          };
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'skill_level',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Skill Level
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const level = row.getValue('skill_level') as number;
          return (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">Level {level}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'specializations',
        header: 'Specializations',
        cell: ({ row }) => {
          const specializations = (row.getValue('specializations') as string[]) || [];
          if (specializations.length === 0)
            return <span className="text-muted-foreground">None</span>;

          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {specializations.slice(0, 2).map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {specializations.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{specializations.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const specializations = row.getValue(id) as string[];
          return specializations.some((spec) => spec.toLowerCase().includes(value.toLowerCase()));
        },
      },
      {
        accessorKey: 'employment_type',
        header: 'Employment',
        cell: ({ row }) => {
          const type = row.getValue('employment_type') as string;
          const typeLabels = {
            full_time: 'Full Time',
            part_time: 'Part Time',
            gig: 'Gig',
            apprentice: 'Apprentice',
          };
          return (
            <span className="capitalize">
              {typeLabels[type as keyof typeof typeLabels] || type}
            </span>
          );
        },
      },
      {
        accessorKey: 'total_jobs_completed',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Jobs
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const jobs = row.getValue('total_jobs_completed') as number;
          return <span className="font-medium">{jobs}</span>;
        },
      },
      {
        accessorKey: 'average_rating',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const rating = row.getValue('average_rating') as number;
          return (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: engineers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  useEffect(() => {
    loadEngineers();
  }, [effectiveAgencyId]);

  const loadEngineers = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/agencies/${effectiveAgencyId}/engineers`);

      if (!response.ok) {
        throw new Error('Failed to load engineers');
      }

      const data = await response.json();
      setEngineers(data.engineers || data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while loading engineers';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setSheetOpen(true);
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
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search engineers..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={(table.getColumn('availability_status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) => {
              const column = table.getColumn('availability_status');
              if (value === 'all') {
                column?.setFilterValue(undefined);
              } else {
                column?.setFilterValue(value);
              }
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_job">On Job</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
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
                  No engineers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Engineer Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto scroll-smooth">
          {selectedEngineer && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEngineer.photo_url} alt={selectedEngineer.name} />
                    <AvatarFallback>
                      {selectedEngineer.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedEngineer.name}</h2>
                    <p className="text-sm text-muted-foreground">Engineer Details</p>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Complete information about this engineer including contact details, skills, and
                  performance metrics.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{selectedEngineer.phone}</span>
                    </div>
                    {selectedEngineer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{selectedEngineer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Employment Type:</span>
                      <Badge variant="outline">
                        {selectedEngineer.employment_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Status:</span>
                      <Badge
                        className={
                          selectedEngineer.availability_status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : selectedEngineer.availability_status === 'on_job'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {selectedEngineer.availability_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Skills & Experience */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Star className="mr-2 h-5 w-5" />
                    Skills & Experience
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Skill Level:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>Level {selectedEngineer.skill_level}</span>
                        <span className="text-sm text-muted-foreground">
                          (
                          {selectedEngineer.skill_level === 1
                            ? 'Beginner'
                            : selectedEngineer.skill_level === 2
                              ? 'Novice'
                              : selectedEngineer.skill_level === 3
                                ? 'Intermediate'
                                : selectedEngineer.skill_level === 4
                                  ? 'Advanced'
                                  : 'Expert'}
                          )
                        </span>
                      </div>
                    </div>

                    {selectedEngineer.specializations &&
                      selectedEngineer.specializations.length > 0 && (
                        <div>
                          <span className="font-medium">Specializations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEngineer.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <Separator />

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">
                        {selectedEngineer.total_jobs_completed}
                      </div>
                      <div className="text-sm text-muted-foreground">Jobs Completed</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center text-2xl font-bold">
                        <Star className="h-5 w-5 text-yellow-400 mr-1" />
                        {selectedEngineer.average_rating.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{selectedEngineer.total_ratings}</div>
                      <div className="text-sm text-muted-foreground">Total Ratings</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{selectedEngineer.success_rate}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Certifications */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Certifications
                  </h3>
                  {selectedEngineer.certifications && selectedEngineer.certifications.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEngineer.certifications.map((cert, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{cert.type}</div>
                            <div className="flex items-center space-x-2">
                              {cert.verified ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-xs">
                                {cert.verified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Level: {cert.level}</div>
                            {cert.cert_number && <div>Certificate #: {cert.cert_number}</div>}
                            {cert.issued_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Issued: {new Date(cert.issued_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No certifications on record</p>
                  )}
                </div>

                <Separator />

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Engineer ID:</span> {selectedEngineer.id}
                    </div>
                    {selectedEngineer.agency_id && (
                      <div>
                        <span className="font-medium">Agency ID:</span> {selectedEngineer.agency_id}
                      </div>
                    )}
                    {selectedEngineer.user_id && (
                      <div>
                        <span className="font-medium">User ID:</span> {selectedEngineer.user_id}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {selectedEngineer.created_at
                        ? new Date(selectedEngineer.created_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{' '}
                      {selectedEngineer.updated_at
                        ? new Date(selectedEngineer.updated_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
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
