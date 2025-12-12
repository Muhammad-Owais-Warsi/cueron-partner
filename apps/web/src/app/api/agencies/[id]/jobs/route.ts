/**
 * Agency Jobs Listing and Filtering API Route
 * GET /api/agencies/{id}/jobs - List and filter jobs for an agency
 *
 * Provides comprehensive job listing with filtering by status, date range,
 * location (PostGIS spatial queries), and multi-filter combination with AND logic.
 * Jobs are sorted by urgency and scheduled time.
 *
 * Requirements: 3.1, 3.2, 3.3, 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission, assertAgencyAccess } from '@cueron/utils/src/authorization';
import { isDemoUser } from '@/lib/demo-data/middleware';
import { generateJobs } from '@/lib/demo-data/generator';
import type { JobStatus, JobUrgency } from '@cueron/types/src/job';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Urgency priority mapping for sorting
 */
const URGENCY_PRIORITY: Record<JobUrgency, number> = {
  emergency: 1,
  urgent: 2,
  normal: 3,
  scheduled: 4,
};

/**
 * GET /api/agencies/{id}/jobs
 * List and filter jobs for an agency
 *
 * Query Parameters:
 * - status: Comma-separated job statuses (e.g., "pending,assigned")
 * - urgency: Comma-separated urgency levels (e.g., "emergency,urgent")
 * - date_from: ISO date string for start of date range
 * - date_to: ISO date string for end of date range
 * - location_lat: Latitude for spatial filtering
 * - location_lng: Longitude for spatial filtering
 * - location_radius_km: Radius in kilometers for spatial filtering
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agencyId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agencyId)) {
      return errorResponse('INVALID_ID', 'Invalid agency ID format', undefined, 400);
    }

    // Get authenticated user session
    const session = await getUserSession();
    // console.log('SESSION', session);

    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401);
    }

    // Check if user has permission to read agency data
    try {
      assertPermission(session.role, 'agency:read');
    } catch (error: any) {
      return errorResponse('FORBIDDEN', error.message, undefined, 403);
    }

    // Check data isolation - user can only access their own agency
    try {
      assertAgencyAccess(session.agency_id, agencyId);
    } catch (error: any) {
      return errorResponse('FORBIDDEN', error.message, undefined, 403);
    }

    // // Parse query parameters
    // const { searchParams } = new URL(request.url);

    // // Status filter
    // const statusParam = searchParams.get('status');
    // const statusFilter: JobStatus[] | null = statusParam
    //   ? statusParam.split(',').map((s) => s.trim() as JobStatus)
    //   : null;

    // // Urgency filter
    // const urgencyParam = searchParams.get('urgency');
    // const urgencyFilter: JobUrgency[] | null = urgencyParam
    //   ? urgencyParam.split(',').map((u) => u.trim() as JobUrgency)
    //   : null;

    // // Date range filter
    // const dateFrom = searchParams.get('date_from');
    // const dateTo = searchParams.get('date_to');

    // // Location filter
    // const locationLat = searchParams.get('location_lat');
    // const locationLng = searchParams.get('location_lng');
    // const locationRadiusKm = searchParams.get('location_radius_km');

    // // Pagination
    // const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    // const offset = (page - 1) * limit;

    // // Check if this is a demo user and serve generated data
    // if (isDemoUser(session)) {
    //   try {
    //     // Generate demo jobs (generate more than needed for filtering)
    //     const allDemoJobs = generateJobs(session.user_id, 100);

    //     // Apply filters to demo data
    //     let filteredJobs = allDemoJobs;

    //     // Apply status filter
    //     if (statusFilter && statusFilter.length > 0) {
    //       filteredJobs = filteredJobs.filter(
    //         (job) => job.status && statusFilter.includes(job.status)
    //       );
    //     }

    //     // Apply urgency filter
    //     if (urgencyFilter && urgencyFilter.length > 0) {
    //       filteredJobs = filteredJobs.filter(
    //         (job) => job.urgency && urgencyFilter.includes(job.urgency)
    //       );
    //     }

    //     // Apply date range filter
    //     if (dateFrom) {
    //       const fromDate = new Date(dateFrom);
    //       filteredJobs = filteredJobs.filter(
    //         (job) => job.created_at && new Date(job.created_at) >= fromDate
    //       );
    //     }
    //     if (dateTo) {
    //       const toDate = new Date(dateTo);
    //       filteredJobs = filteredJobs.filter(
    //         (job) => job.created_at && new Date(job.created_at) <= toDate
    //       );
    //     }

    //     // Apply location filter if provided
    //     const hasLocationFilter = locationLat && locationLng && locationRadiusKm;
    //     if (hasLocationFilter) {
    //       const lat = parseFloat(locationLat);
    //       const lng = parseFloat(locationLng);
    //       const radiusKm = parseFloat(locationRadiusKm);

    //       filteredJobs = filteredJobs.filter((job) => {
    //         if (!job.site_location?.lat || !job.site_location?.lng) {
    //           return false;
    //         }
    //         const distance = calculateDistance(
    //           lat,
    //           lng,
    //           job.site_location.lat,
    //           job.site_location.lng
    //         );
    //         return distance <= radiusKm;
    //       });
    //     }

    //     // Sort by urgency and scheduled time
    //     filteredJobs.sort((a: any, b: any) => {
    //       const urgencyDiff =
    //         URGENCY_PRIORITY[a.urgency as JobUrgency] - URGENCY_PRIORITY[b.urgency as JobUrgency];
    //       if (urgencyDiff !== 0) {
    //         return urgencyDiff;
    //       }
    //       const aTime = a.scheduled_time
    //         ? new Date(a.scheduled_time).getTime()
    //         : a.created_at
    //           ? new Date(a.created_at).getTime()
    //           : Infinity;
    //       const bTime = b.scheduled_time
    //         ? new Date(b.scheduled_time).getTime()
    //         : b.created_at
    //           ? new Date(b.created_at).getTime()
    //           : Infinity;
    //       return aTime - bTime;
    //     });

    //     // Apply pagination
    //     const totalFiltered = filteredJobs.length;
    //     const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    //     // Build response matching the exact format of real data
    //     const response = {
    //       jobs: paginatedJobs,
    //       pagination: {
    //         page,
    //         limit,
    //         total: totalFiltered,
    //         total_pages: Math.ceil(totalFiltered / limit),
    //         has_next: page < Math.ceil(totalFiltered / limit),
    //         has_prev: page > 1,
    //       },
    //       filters_applied: {
    //         status: statusFilter,
    //         urgency: urgencyFilter,
    //         date_from: dateFrom,
    //         date_to: dateTo,
    //         location: hasLocationFilter
    //           ? {
    //               lat: parseFloat(locationLat!),
    //               lng: parseFloat(locationLng!),
    //               radius_km: parseFloat(locationRadiusKm!),
    //             }
    //           : null,
    //       },
    //     };

    //     return successResponse(response);
    //   } catch (error) {
    //     console.error('Error generating demo jobs data:', error);
    //     // Fall through to real data query on error
    //   }
    // }

    // // Validate filters
    // const validStatuses: JobStatus[] = [
    //   'pending',
    //   'assigned',
    //   'accepted',
    //   'travelling',
    //   'onsite',
    //   'completed',
    //   'cancelled',
    // ];
    // const validUrgencies: JobUrgency[] = ['emergency', 'urgent', 'normal', 'scheduled'];

    // if (statusFilter) {
    //   const invalidStatuses = statusFilter.filter((s) => !validStatuses.includes(s));
    //   if (invalidStatuses.length > 0) {
    //     return errorResponse(
    //       'INVALID_FILTER',
    //       `Invalid status values: ${invalidStatuses.join(', ')}`,
    //       { status: [`Valid values are: ${validStatuses.join(', ')}`] },
    //       400
    //     );
    //   }
    // }

    // if (urgencyFilter) {
    //   const invalidUrgencies = urgencyFilter.filter((u) => !validUrgencies.includes(u));
    //   if (invalidUrgencies.length > 0) {
    //     return errorResponse(
    //       'INVALID_FILTER',
    //       `Invalid urgency values: ${invalidUrgencies.join(', ')}`,
    //       { urgency: [`Valid values are: ${validUrgencies.join(', ')}`] },
    //       400
    //     );
    //   }
    // }

    // // Validate date range
    // if (dateFrom && isNaN(Date.parse(dateFrom))) {
    //   return errorResponse(
    //     'INVALID_FILTER',
    //     'Invalid date_from format. Use ISO 8601 format',
    //     { date_from: ['Must be a valid ISO 8601 date string'] },
    //     400
    //   );
    // }

    // if (dateTo && isNaN(Date.parse(dateTo))) {
    //   return errorResponse(
    //     'INVALID_FILTER',
    //     'Invalid date_to format. Use ISO 8601 format',
    //     { date_to: ['Must be a valid ISO 8601 date string'] },
    //     400
    //   );
    // }

    // // Validate location filter
    // const hasLocationFilter = locationLat && locationLng && locationRadiusKm;
    // if (hasLocationFilter) {
    //   const lat = parseFloat(locationLat);
    //   const lng = parseFloat(locationLng);
    //   const radius = parseFloat(locationRadiusKm);

    //   if (isNaN(lat) || lat < -90 || lat > 90) {
    //     return errorResponse(
    //       'INVALID_FILTER',
    //       'Invalid location_lat. Must be between -90 and 90',
    //       { location_lat: ['Must be a valid latitude between -90 and 90'] },
    //       400
    //     );
    //   }

    //   if (isNaN(lng) || lng < -180 || lng > 180) {
    //     return errorResponse(
    //       'INVALID_FILTER',
    //       'Invalid location_lng. Must be between -180 and 180',
    //       { location_lng: ['Must be a valid longitude between -180 and 180'] },
    //       400
    //     );
    //   }

    //   if (isNaN(radius) || radius <= 0) {
    //     return errorResponse(
    //       'INVALID_FILTER',
    //       'Invalid location_radius_km. Must be a positive number',
    //       { location_radius_km: ['Must be a positive number'] },
    //       400
    //     );
    //   }
    // }

    // Create Supabase client
    const supabase = await createClient();

    // Build query with filters
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        engineers:assigned_engineer_id (
          user_id,
          name,
          email,
          phone
        )
      `
      )
      .eq('assigned_agency_id', agencyId);

    console.log(jobs);

    // // Apply status filter (Property 83: Status filter accuracy)
    // if (statusFilter && statusFilter.length > 0) {
    //   query = query.in('status', statusFilter);
    // }

    // // Apply urgency filter
    // if (urgencyFilter && urgencyFilter.length > 0) {
    //   query = query.in('urgency', urgencyFilter);
    // }

    // // Apply date range filter (Property 84: Date range filter accuracy)
    // if (dateFrom) {
    //   query = query.gte('scheduled_time', dateFrom);
    // }
    // if (dateTo) {
    //   query = query.lte('scheduled_time', dateTo);
    // }

    // Execute query to get jobs

    if (error) {
      console.error('Error fetching jobs:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch jobs', undefined, 500);
    }

    // let filteredJobs = jobs || [];

    // // Apply spatial filter using PostGIS (Property 85: Spatial filter accuracy)
    // if (hasLocationFilter && filteredJobs.length > 0) {
    //   const lat = parseFloat(locationLat!);
    //   const lng = parseFloat(locationLng!);
    //   const radiusMeters = parseFloat(locationRadiusKm!) * 1000;

    //   // Use PostGIS ST_DWithin for spatial filtering
    //   const { data: spatialJobs, error: spatialError } = await supabase.rpc(
    //     'filter_jobs_by_location',
    //     {
    //       p_agency_id: agencyId,
    //       p_lat: lat,
    //       p_lng: lng,
    //       p_radius_meters: radiusMeters,
    //       p_job_ids: filteredJobs.map((j) => j.id),
    //     }
    //   );

    //   if (spatialError) {
    //     console.error('Error applying spatial filter:', spatialError);
    //     // If RPC doesn't exist, fall back to client-side filtering
    //     // This is a simplified Haversine distance calculation
    //     filteredJobs = filteredJobs.filter((job) => {
    //       if (!job.site_location?.lat || !job.site_location?.lng) {
    //         return false;
    //       }
    //       const distance = calculateDistance(
    //         lat,
    //         lng,
    //         job.site_location.lat,
    //         job.site_location.lng
    //       );
    //       return distance <= parseFloat(locationRadiusKm!);
    //     });
    //   } else {
    //     // Use spatially filtered results
    //     const spatialJobIds = new Set(spatialJobs.map((j: any) => j.id));
    //     filteredJobs = filteredJobs.filter((j) => spatialJobIds.has(j.id));
    //   }
    // }

    // // Sort by urgency and scheduled time (Property 13: Job list sorting)
    // // Requirements 3.3: Jobs sorted by urgency and scheduled time
    // filteredJobs.sort((a: any, b: any) => {
    //   // First, sort by urgency priority
    //   const urgencyDiff =
    //     URGENCY_PRIORITY[a.urgency as JobUrgency] - URGENCY_PRIORITY[b.urgency as JobUrgency];
    //   if (urgencyDiff !== 0) {
    //     return urgencyDiff;
    //   }

    //   // Then sort by scheduled time (earlier first)
    //   const aTime = a.scheduled_time ? new Date(a.scheduled_time).getTime() : Infinity;
    //   const bTime = b.scheduled_time ? new Date(b.scheduled_time).getTime() : Infinity;
    //   return aTime - bTime;
    // });

    // // Apply pagination
    // const totalFiltered = filteredJobs.length;
    // const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    // // Build response
    // const response = {
    //   jobs: paginatedJobs,
    //   pagination: {
    //     page,
    //     limit,
    //     total: totalFiltered,
    //     total_pages: Math.ceil(totalFiltered / limit),
    //     has_next: page < Math.ceil(totalFiltered / limit),
    //     has_prev: page > 1,
    //   },
    //   filters_applied: {
    //     status: statusFilter,
    //     urgency: urgencyFilter,
    //     date_from: dateFrom,
    //     date_to: dateTo,
    //     location: hasLocationFilter
    //       ? {
    //           lat: parseFloat(locationLat!),
    //           lng: parseFloat(locationLng!),
    //           radius_km: parseFloat(locationRadiusKm!),
    //         }
    //       : null,
    //   },
    // };

    return successResponse(jobs);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/jobs:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', undefined, 500);
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
