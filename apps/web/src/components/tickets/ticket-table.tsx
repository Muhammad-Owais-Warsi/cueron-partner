'use client';

/**
 * Tickets List View Component
 *
 * Displays list of tickets with equipment information and inspection scheduling.
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
} from 'lucide-react';

interface Ticket {
  id: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  brand_name: string;
  years_of_operation_in_equipment: number | null;
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
  created_at: string | null;
}

export function TicketsListView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const columns: ColumnDef<Ticket>[] = useMemo(
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
          const ticket = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{ticket.company_name}</p>
              <p className="text-sm text-muted-foreground">{ticket.location}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'equipment_type',
        header: 'Equipment',
        cell: ({ row }) => {
          const ticket = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{ticket.equipment_type}</p>
              <p className="text-sm text-muted-foreground">{ticket.brand_name}</p>
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
          const ticket = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{ticket.poc_name}</p>
              <p className="text-sm text-muted-foreground">{ticket.poc_phone}</p>
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
    data: tickets,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const url = `/api/new/tickets`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while loading tickets';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ticket Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle>Ticket Details</SheetTitle>
                <SheetDescription>{selectedTicket.company_name}</SheetDescription>
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
                      <span className="col-span-2 font-medium">{selectedTicket.company_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="col-span-2">{selectedTicket.company_phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2">{selectedTicket.company_email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="col-span-2">{selectedTicket.location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">GST:</span>
                      <span className="col-span-2">{selectedTicket.gst}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Billing Address:</span>
                      <span className="col-span-2">{selectedTicket.billing_address}</span>
                    </div>
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
                        {selectedTicket.equipment_type}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Brand Name:</span>
                      <span className="col-span-2">{selectedTicket.brand_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Serial Number:</span>
                      <span className="col-span-2 font-mono">{selectedTicket.equipment_sl_no}</span>
                    </div>
                    {selectedTicket.capacity && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="col-span-2">{selectedTicket.capacity}</span>
                      </div>
                    )}
                    {selectedTicket.years_of_operation_in_equipment && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Years in Operation:</span>
                        <span className="col-span-2">
                          {selectedTicket.years_of_operation_in_equipment} years
                        </span>
                      </div>
                    )}
                    {selectedTicket.specification_plate_photo && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Specification Plate:</span>
                        <a
                          href={selectedTicket.specification_plate_photo}
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
                        {new Date(selectedTicket.inspection_date).toLocaleDateString('en-US', {
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
                        {new Date(selectedTicket.inspection_time).toLocaleTimeString([], {
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
                      <span className="col-span-2 font-medium">{selectedTicket.poc_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="col-span-2">{selectedTicket.poc_phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2">{selectedTicket.poc_email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Problem Statement */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Problem Statement
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.problem_statement}
                    </p>
                  </div>
                </div>

                {/* Photos */}
                {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Photos ({selectedTicket.photos.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTicket.photos.map((photo, index) => (
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
                      <span className="text-muted-foreground">Ticket ID:</span>
                      <span className="col-span-2 font-mono text-xs">{selectedTicket.id}</span>
                    </div>
                    {selectedTicket.created_at && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Created At:</span>
                        <span className="col-span-2">
                          {new Date(selectedTicket.created_at).toLocaleString('en-US', {
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
