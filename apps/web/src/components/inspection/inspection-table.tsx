'use client';

/**
 * Inspections List View Component
 * High-contrast dashboard view for equipment inspections.
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
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  ImageIcon,
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
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            COMPANY
            <ArrowUpDown className="h-3 w-3" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col py-1 max-w-[200px]">
            <span className="font-bold text-foreground tracking-tight leading-none mb-1 break-words">
              {row.original.company_name}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-medium truncate">
              <MapPin className="h-3 w-3" /> {row.original.location}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'equipment_type',
        header: 'EQUIPMENT',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground/90 leading-none mb-1 capitalize truncate max-w-[150px]">
              {row.original.equipment_type}
            </span>
            <Badge
              variant="outline"
              className="w-fit px-1.5 h-4 text-[9px] font-black uppercase tracking-tighter bg-muted/50 border-muted-foreground/20"
            >
              {row.original.brand_name}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'inspection_date',
        header: 'SCHEDULE',
        cell: ({ row }) => {
          const date = new Date(row.original.inspection_date);
          const time = new Date(row.original.inspection_time);
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Calendar className="h-3 w-3 text-primary" />
                {date.toLocaleDateString('en-GB')}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground ml-4.5 italic">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'poc_name',
        header: 'POINT OF CONTACT',
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[150px]">
            <span className="text-xs font-bold text-foreground truncate">
              {row.original.poc_name}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {row.original.poc_phone}
            </span>
          </div>
        ),
      },
      {
        id: 'chevron',
        header: '',
        cell: () => (
          <div className="flex justify-end pr-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ),
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
    state: { sorting },
  });

  const loadInspections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new/inspection');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInspections(data.inspections || data);
    } catch (err) {
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const handleRowClick = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner className="text-primary" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black animate-pulse">
          Retrieving Inspections
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm overflow-x-auto">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/20 transition-colors group"
                  onClick={() => handleRowClick(row.original)}
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
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <ClipboardCheck className="h-8 w-8 mb-1" />
                    <p className="text-sm font-bold uppercase tracking-tight text-foreground">
                      No records found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[600px] overflow-y-auto border-l-0 sm:border-l p-0 gap-0">
          {selectedInspection && (
            <div className="flex flex-col h-full">
              <div className="p-8 bg-muted/30 border-b">
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary hover:bg-primary font-black tracking-widest text-[9px] uppercase px-2 h-5">
                      Inspection Log
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ID: {selectedInspection.id.slice(0, 8)}
                    </span>
                  </div>
                  <SheetTitle className="text-2xl font-black tracking-tighter uppercase leading-none break-words">
                    {selectedInspection.company_name}
                  </SheetTitle>
                  <SheetDescription className="text-xs font-medium uppercase tracking-widest flex items-center gap-2 mt-1 break-words">
                    <MapPin className="h-3 w-3 shrink-0" /> {selectedInspection.location}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="p-8 space-y-8">
                {/* Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <SectionBlock icon={Building2} title="Company Entity">
                    <DataRow label="Phone" value={selectedInspection.company_phone} />
                    <DataRow label="Email" value={selectedInspection.company_email} />
                    <DataRow label="GST" value={selectedInspection.gst} />
                    <DataRow
                      label="Billing"
                      value={selectedInspection.billing_address}
                      className="col-span-1 sm:col-span-2"
                    />
                  </SectionBlock>

                  <SectionBlock icon={Package} title="Asset Specs">
                    <DataRow label="Type" value={selectedInspection.equipment_type} />
                    <DataRow label="Serial" value={selectedInspection.equipment_sl_no} />
                    <DataRow
                      label="Capacity"
                      value={selectedInspection.capacity?.toString() ?? 'N/A'}
                    />
                    <DataRow
                      label="Age"
                      value={`${selectedInspection.years_of_operation_in_equipment ?? 0} Years`}
                    />
                  </SectionBlock>
                </div>

                <Separator className="opacity-50" />

                {/* Problems and Solutions */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Problem Statement
                    </h4>
                    <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg text-sm font-medium leading-relaxed text-red-900 whitespace-pre-wrap break-words italic">
                      "{selectedInspection.problem_statement}"
                    </div>
                  </div>

                  {selectedInspection.possible_solution && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-green-600">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Proposed Solution
                      </h4>
                      <div className="p-4 bg-green-50/50 border border-green-100 rounded-lg text-sm font-medium leading-relaxed text-green-900 whitespace-pre-wrap break-words">
                        {selectedInspection.possible_solution}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos Section */}
                {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Visual Evidence (
                      {selectedInspection.photos.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedInspection.photos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square rounded-lg bg-muted border overflow-hidden hover:ring-2 ring-primary transition-all group"
                        >
                          <img
                            src={url}
                            alt="Site"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 min-w-0 w-full">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 truncate">
        <Icon className="h-4 w-4 text-primary shrink-0" /> {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground/90 leading-tight break-all sm:break-words whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );
}
