// /**
//  * Jobs List View Component
//  * Displays jobs with filtering, sorting, and pagination
//  * Requirements: 3.1, 3.3, 18.1, 18.2, 18.3, 18.4
//  */

// 'use client';

// import { useState, useEffect } from 'react';
// import { useUserProfile } from '@/hooks/useAuth';
// import type { Job, JobFilters } from '@cueron/types';
// import { JobsTable } from './JobsTable';
// import { JobsFilters } from './JobsFilters';
// import { JobsPagination } from './JobsPagination';
// import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';
// import { Spinner } from '../ui/spinner';
// import { toast } from 'sonner';

// interface JobsResponse {
//   jobs: Job[];
//   total: number;
//   page: number;
//   limit: number;
// }

// export function JobsListView() {
//   // const { profile } = useUserProfile();
//   // const {
//   //   jobs,
//   //   loading: jobsLoading,
//   //   error: jobsError,
//   //   refresh,
//   // } = useRealtimeJobs(profile?.agency?.id);
//   // const [loading, setLoading] = useState(false);
//   // const [error, setError] = useState<string | null>(null);
//   // const [total, setTotal] = useState(0);
//   // const [page, setPage] = useState(1);
//   // const [limit] = useState(10);

//   // // Filter state
//   // const [filters, setFilters] = useState<JobFilters>({});
//   // const [sortBy, setSortBy] = useState<'urgency' | 'scheduled_time'>('urgency');
//   // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

//   // const loadJobs = async () => {
//   //   if (!profile?.agency?.id) return;

//   //   try {
//   //     setLoading(true);
//   //     setError(null);

//   //     // Build query parameters
//   //     const params = new URLSearchParams({
//   //       page: page.toString(),
//   //       limit: limit.toString(),
//   //       sort_by: sortBy,
//   //       sort_order: sortOrder,
//   //     });

//   //     // Add filters
//   //     if (filters.status && filters.status.length > 0) {
//   //       params.append('status', filters.status.join(','));
//   //     }
//   //     if (filters.urgency && filters.urgency.length > 0) {
//   //       params.append('urgency', filters.urgency.join(','));
//   //     }
//   //     if (filters.date_from) {
//   //       params.append(
//   //         'date_from',
//   //         typeof filters.date_from === 'string'
//   //           ? filters.date_from
//   //           : filters.date_from.toISOString()
//   //       );
//   //     }
//   //     if (filters.date_to) {
//   //       params.append(
//   //         'date_to',
//   //         typeof filters.date_to === 'string' ? filters.date_to : filters.date_to.toISOString()
//   //       );
//   //     }
//   //     if (filters.location) {
//   //       params.append('lat', filters.location.lat.toString());
//   //       params.append('lng', filters.location.lng.toString());
//   //       params.append('radius_km', filters.location.radius_km.toString());
//   //     }

//   //     const response = await fetch(`/api/agencies/${profile.agency.id}/jobs?${params.toString()}`);

//   //     if (!response.ok) {
//   //       throw new Error('Failed to load jobs');
//   //     }

//   //     const data: JobsResponse = await response.json();
//   //     setTotal(data.total);
//   //     // Note: We're using real-time jobs from the hook, but we still need the total count
//   //   } catch (err) {
//   //     console.error('Error loading jobs:', err);
//   //     setError(err instanceof Error ? err.message : 'Failed to load jobs');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // useEffect(() => {
//   //   if (profile?.agency?.id) {
//   //     void loadJobs();
//   //   }
//   // }, [profile, page, filters, sortBy, sortOrder, loadJobs]);

//   // const handleFilterChange = (newFilters: JobFilters) => {
//   //   setFilters(newFilters);
//   //   setPage(1); // Reset to first page when filters change
//   // };

//   // const handleSortChange = (field: 'urgency' | 'scheduled_time') => {
//   //   if (sortBy === field) {
//   //     // Toggle sort order if same field
//   //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//   //   } else {
//   //     setSortBy(field);
//   //     setSortOrder('desc');
//   //   }
//   // };

//   // const handlePageChange = (newPage: number) => {
//   //   setPage(newPage);
//   // };

//   // const handleJobStatusChange = async (jobId: string, newStatus: 'accepted' | 'cancelled') => {
//   //   try {
//   //     setLoading(true);

//   //     const response = await fetch(`/api/jobs/${jobId}/status`, {
//   //       method: 'PATCH',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //       },
//   //       body: JSON.stringify({ status: newStatus }),
//   //     });

//   //     if (!response.ok) {
//   //       throw new Error('Failed to update job status');
//   //     }

//   //     // Refresh jobs to reflect the status change
//   //     await refresh();
//   //   } catch (err) {
//   //     console.error('Error updating job status:', err);
//   //     setError(err instanceof Error ? err.message : 'Failed to update job status');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // // Combine loading states
//   // const isLoading = loading;
//   // const hasError = error;

//   // if (isLoading) {
//   //   return (
//   //     <div className="bg-white rounded-lg shadow-sm p-8">
//   //       <div className="flex items-center justify-center">
//   //         <Spinner />
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // if (hasError) {
//   //   return <>{toast.error('Error finding jobs')}</>;
//   // }

//   const mockJobs: Job[] = [
//     {
//       id: '1a2b3c4d-0000-0000-0000-000000000001',
//       job_number: 'J-2024-001',
//       client_id: 'client-uuid-001',
//       client_name: 'Acme Industries',
//       client_phone: '+1-555-1234',
//       job_type: 'Repair',
//       equipment_type: 'HVAC',
//       equipment_details: {
//         brand: 'Daikin',
//         model: 'DX20VC',
//         serial_number: 'SN12345',
//         capacity: '5 Ton',
//       },
//       issue_description: 'Unit not cooling properly.',
//       site_location: {
//         address: '123 Main St',
//         city: 'Metropolis',
//         state: 'NY',
//         pincode: '10001',
//         lat: 40.7128,
//         lng: -74.006,
//       },
//       assigned_agency_id: 'agency-uuid-001',
//       assigned_engineer_id: 'engineer-uuid-001',
//       required_skill_level: 5,
//       scheduled_time: '2024-06-10T10:00:00Z',
//       urgency: 'urgent',
//       response_deadline: '2024-06-09T18:00:00Z',
//       status: 'assigned',
//       assigned_at: '2024-06-09T09:00:00Z',
//       accepted_at: '2024-06-09T10:00:00Z',
//       started_at: undefined,
//       completed_at: undefined,
//       service_fee: 250,
//       payment_status: 'pending',
//       service_checklist: [
//         { item: 'Check compressor', completed: false },
//         { item: 'Inspect filters', completed: false },
//       ],
//       parts_used: [],
//       photos_before: [],
//       photos_after: [],
//       engineer_notes: '',
//       client_signature_url: '',
//       client_rating: undefined,
//       client_feedback: '',
//       created_at: '2024-06-08T12:00:00Z',
//       updated_at: '2024-06-09T10:00:00Z',
//     },
//     {
//       id: '1a2b3c4d-0000-0000-0000-000000000002',
//       job_number: 'J-2024-002',
//       client_id: 'client-uuid-002',
//       client_name: 'Wayne Enterprises',
//       client_phone: '+1-555-5678',
//       job_type: 'Installation',
//       equipment_type: 'Generator',
//       equipment_details: {
//         brand: 'Cummins',
//         model: 'QSB7',
//         serial_number: 'SN67890',
//         capacity: '200 kW',
//       },
//       issue_description: 'Install new generator.',
//       site_location: {
//         address: '1007 Mountain Dr',
//         city: 'Gotham',
//         state: 'NJ',
//         pincode: '07001',
//         lat: 40.7128,
//         lng: -74.0059,
//       },
//       assigned_agency_id: 'agency-uuid-002',
//       assigned_engineer_id: 'engineer-uuid-002',
//       required_skill_level: 3,
//       scheduled_time: '2024-06-12T14:00:00Z',
//       urgency: 'scheduled',
//       response_deadline: '2024-06-11T18:00:00Z',
//       status: 'pending',
//       assigned_at: undefined,
//       accepted_at: undefined,
//       started_at: undefined,
//       completed_at: undefined,
//       service_fee: 500,
//       payment_status: 'paid',
//       service_checklist: [],
//       parts_used: [],
//       photos_before: [],
//       photos_after: [],
//       engineer_notes: '',
//       client_signature_url: '',
//       client_rating: undefined,
//       client_feedback: '',
//       created_at: '2024-06-10T09:00:00Z',
//       updated_at: '2024-06-10T09:00:00Z',
//     },
//   ];

//   return (
//     <div className="">
//       {/* Filters */}
//       {/*<JobsFilters filters={filters} onFilterChange={handleFilterChange} loading={isLoading} />*/}

//       {/* Jobs Table */}
//       <JobsTable
//       // jobs={mockJobs}
//       // loading={isLoading}
//       // sortBy={sortBy}
//       // sortOrder={sortOrder}
//       // onSortChange={handleSortChange}
//       // onJobStatusChange={handleJobStatusChange}
//       />

//       {/* Pagination */}
//       {/*{total > limit && (
//         <JobsPagination
//           currentPage={page}
//           totalPages={Math.ceil(total / limit)}
//           totalItems={total}
//           itemsPerPage={limit}
//           onPageChange={handlePageChange}
//         />
//       )}*/}

//       {/* Empty state */}
//       {/*{!isLoading && jobs.length === 0 && (
//         <div className="bg-white rounded-lg shadow-sm p-12 text-center">
//           <svg
//             className="w-16 h-16 text-gray-400 mx-auto mb-4"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
//             />
//           </svg>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
//           <p className="text-gray-600">
//             {Object.keys(filters).length > 0
//               ? 'Try adjusting your filters to see more results'
//               : 'No jobs have been assigned to your agency yet'}
//           </p>
//         </div>
//       )}*/}
//     </div>
//   );
// }
