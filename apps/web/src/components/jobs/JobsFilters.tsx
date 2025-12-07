// /**
//  * Jobs Filters Component
//  * Provides filtering controls for jobs list
//  * Requirements: 18.1, 18.2, 18.3, 18.4
//  */

// 'use client';

// import { useState } from 'react';
// import type { JobFilters, JobStatus, Timestamp } from '@cueron/types';
// import { StatusFilter } from './filters/StatusFilter';
// import { DateRangeFilter } from './filters/DateRangeFilter';
// import { LocationFilter } from './filters/LocationFilter';

// interface JobsFiltersProps {
//   filters: JobFilters;
//   onFilterChange: (filters: JobFilters) => void;
//   loading?: boolean;
// }

// export function JobsFilters({ filters, onFilterChange, loading }: JobsFiltersProps) {
//   const [isExpanded, setIsExpanded] = useState(false);

//   const handleStatusChange = (status: JobStatus[]) => {
//     onFilterChange({ ...filters, status });
//   };

//   const handleDateRangeChange = (dateFrom?: string, dateTo?: string) => {
//     onFilterChange({
//       ...filters,
//       date_from: dateFrom as Timestamp | undefined,
//       date_to: dateTo as Timestamp | undefined,
//     });
//   };

//   const handleLocationChange = (location?: { lat: number; lng: number; radius_km: number }) => {
//     onFilterChange({ ...filters, location });
//   };

//   const handleClearFilters = () => {
//     onFilterChange({});
//   };

//   const activeFilterCount = [
//     filters.status?.length || 0,
//     filters.date_from || filters.date_to ? 1 : 0,
//     filters.location ? 1 : 0,
//   ].reduce((sum, count) => sum + count, 0);

//   return (
//     <div className="bg-white rounded-lg shadow-sm">
//       {/* Filter Header */}
//       <div className="p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => setIsExpanded(!isExpanded)}
//               className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
//               disabled={loading}
//             >
//               <svg
//                 className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 9l-7 7-7-7"
//                 />
//               </svg>
//               <span>Filters</span>
//             </button>
//             {activeFilterCount > 0 && (
//               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                 {activeFilterCount} active
//               </span>
//             )}
//           </div>
//           {activeFilterCount > 0 && (
//             <button
//               onClick={handleClearFilters}
//               className="text-sm text-gray-600 hover:text-gray-900"
//               disabled={loading}
//             >
//               Clear all
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Filter Controls */}
//       {isExpanded && (
//         <div className="p-4 space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {/* Status Filter */}
//             <StatusFilter
//               selectedStatuses={filters.status || []}
//               onChange={handleStatusChange}
//               disabled={loading}
//             />

//             {/* Date Range Filter */}
//             <DateRangeFilter
//               dateFrom={filters.date_from ? new Date(filters.date_from).toISOString().split('T')[0] : undefined}
//               dateTo={filters.date_to ? new Date(filters.date_to).toISOString().split('T')[0] : undefined}
//               onChange={handleDateRangeChange}
//               disabled={loading}
//             />

//             {/* Location Filter */}
//             <LocationFilter
//               location={filters.location}
//               onChange={handleLocationChange}
//               disabled={loading}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
