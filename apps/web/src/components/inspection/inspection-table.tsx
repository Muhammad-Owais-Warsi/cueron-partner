'use client';

/**
 * Inspections List View Component
 *
 * Displays list of inspections with equipment information and solutions.
 */

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

import {
  Phone,
  Mail,
  ArrowUpDown,
  MapPin,
  Calendar,
  Building2,
  User,
  FileText,
  Image as ImageIcon,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Inspection {
  id: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  brand_name: string;
  years_of_operation_in_equipment: number | null;
  years_of_operations: number | null;
  location: string;
  inspection_date: string;
  inspection_time: string;
  photos: string[] | null;
  gst: string;
  billing_address: string;
  equipment_type: string;
  equipment_sl_no: string;
  capacity: number | null;
  specification_plate_photo: string | null;
  poc_name: string;
  poc_phone: string;
  poc_email: string;
  problem_statement: string;
  possible_solution: string | null;
  created_at: string | null;
}

export function InspectionsListView() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const columns: ColumnDef<Inspection>[] = useMemo(
    () => [
      {
        accessorKey: 'company_name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const inspection = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{inspection.company_name}</p>
              <p className="text-sm text-muted-foreground">{inspection.location}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'equipment_type',
        header: 'Equipment',
        cell: ({ row }) => {
          const inspection = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{inspection.equipment_type}</p>
              <p className="text-sm text-muted-foreground">{inspection.brand_name}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'inspection_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Inspection Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue('inspection_date'));
          return (
            <div className="space-y-1">
              <p>{date.toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(row.original.inspection_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'poc_name',
        header: 'Contact Person',
        cell: ({ row }) => {
          const inspection = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{inspection.poc_name}</p>
              <p className="text-sm text-muted-foreground">{inspection.poc_phone}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const createdAt = row.getValue('created_at') as string;
          return createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: inspections,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/new/inspection');

      if (!response.ok) {
        throw new Error('Failed to load inspections');
      }

      const data = await response.json();
      setInspections(data.inspections || data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while loading inspections';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (inspection: Inspection) => {
    setSelectedInspection(inspection);
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
                  No inspections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inspection Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
          {selectedInspection && (
            <>
              <SheetHeader>
                <SheetTitle>Inspection Details</SheetTitle>
                <SheetDescription>{selectedInspection.company_name}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Company Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Company Name:</span>
                      <span className="col-span-2 font-medium">
                        {selectedInspection.company_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="col-span-2">{selectedInspection.company_phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2">{selectedInspection.company_email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="col-span-2">{selectedInspection.location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">GST:</span>
                      <span className="col-span-2">{selectedInspection.gst}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Billing Address:</span>
                      <span className="col-span-2">{selectedInspection.billing_address}</span>
                    </div>
                    {selectedInspection.years_of_operations && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Years of Operations:</span>
                        <span className="col-span-2">
                          {selectedInspection.years_of_operations} years
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Equipment Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Equipment Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Equipment Type:</span>
                      <span className="col-span-2 font-medium">
                        {selectedInspection.equipment_type}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Brand Name:</span>
                      <span className="col-span-2">{selectedInspection.brand_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Serial Number:</span>
                      <span className="col-span-2 font-mono">
                        {selectedInspection.equipment_sl_no}
                      </span>
                    </div>
                    {selectedInspection.capacity && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="col-span-2">{selectedInspection.capacity}</span>
                      </div>
                    )}
                    {selectedInspection.years_of_operation_in_equipment && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Years in Operation:</span>
                        <span className="col-span-2">
                          {selectedInspection.years_of_operation_in_equipment} years
                        </span>
                      </div>
                    )}
                    {selectedInspection.specification_plate_photo && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Specification Plate:</span>
                        <a
                          href={selectedInspection.specification_plate_photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-2 text-primary hover:underline"
                        >
                          View Photo
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Inspection Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Inspection Schedule
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="col-span-2">
                        {new Date(selectedInspection.inspection_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="col-span-2">
                        {new Date(selectedInspection.inspection_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Point of Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Point of Contact
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="col-span-2 font-medium">{selectedInspection.poc_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="col-span-2">{selectedInspection.poc_phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2">{selectedInspection.poc_email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Problem Statement */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Problem Statement
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedInspection.problem_statement}
                    </p>
                  </div>
                </div>

                {/* Possible Solution */}
                {selectedInspection.possible_solution && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                        Possible Solution
                      </h3>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedInspection.possible_solution}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Photos */}
                {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Photos ({selectedInspection.photos.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedInspection.photos.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* System Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Inspection ID:</span>
                      <span className="col-span-2 font-mono text-xs">{selectedInspection.id}</span>
                    </div>
                    {selectedInspection.created_at && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Created At:</span>
                        <span className="col-span-2">
                          {new Date(selectedInspection.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
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
