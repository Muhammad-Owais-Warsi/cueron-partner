'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Search,
  FileText,
  Calendar,
  Briefcase,
  Package,
  Image as ImageIcon,
  ArrowUpDown,
  IndianRupee,
} from 'lucide-react';

interface SurveysListViewProps {
  agencyId?: string;
}

export type Survey = {
  id: string;
  agency_id: string;
  job_number: string;
  description: string;
  equipments_required: string[];
  amount: number | null;
  photos: string[] | null;
  created_at: string;
};

export function SurveysListView({ agencyId: propAgencyId }: SurveysListViewProps) {
  // const { profile: userProfile } = useUserProfile();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('ID', propAgencyId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // const effectiveAgencyId = propAgencyId || userProfile?.agency?.id || null;

  // TABLE COLUMNS
  const columns: ColumnDef<Survey>[] = useMemo(
    () => [
      {
        accessorKey: 'job_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Job #
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.job_number}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="line-clamp-1 text-sm text-muted-foreground">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: 'equipments_required',
        header: 'Equipments',
        cell: ({ row }) => {
          const eq = row.original.equipments_required;
          return (
            <div className="flex flex-wrap gap-1">
              {eq.slice(0, 2).map((e, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {e}
                </Badge>
              ))}
              {eq.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{eq.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Amount
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <IndianRupee className="h-3 w-3 mr-1" />
            {row.original.amount ?? '—'}
          </div>
        ),
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
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{new Date(row.original.created_at).toLocaleDateString()}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: surveys,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility },
  });

  useEffect(() => {
    loadSurveys();
  }, [propAgencyId]);

  const loadSurveys = async () => {
    try {
      if (!propAgencyId) {
        return;
      }

      setLoading(true);

      const response = await fetch(`/api/agencies/${propAgencyId}/surveys`);
      if (!response.ok) throw new Error('Failed to load surveys');

      const data = await response.json();
      setSurveys(data.surveys || data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error loading surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (survey: Survey) => {
    setSelectedSurvey(survey);
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
      <div className="relative w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search job id…"
          value={(table.getColumn('job_number')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('job_number')?.setFilterValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={columns.length} className="text-center h-24">
                  No surveys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAILS SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
          {selectedSurvey && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <div>
                    <h2 className="text-lg font-semibold">Survey #{selectedSurvey.job_id}</h2>
                    <p className="text-muted-foreground text-sm">Survey Details</p>
                  </div>
                </SheetTitle>
                <SheetDescription>All information about this survey.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Basic Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Job ID:</span> {selectedSurvey.job_id}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>{' '}
                      {selectedSurvey.amount ? `₹${selectedSurvey.amount}` : '—'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(selectedSurvey.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Equipments Required
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedSurvey.equipments_required.map((eq, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Photos
                  </h3>
                  {selectedSurvey.photos?.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSurvey.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          className="rounded-md border object-cover w-full h-28"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No photos uploaded.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
