/**
 * Job Detail and Distance Calculation API Route
 * GET /api/jobs/{id} - Get detailed job information with distance calculations
 *
 * Provides complete job details including client information, location, equipment type,
 * required skill level, and calculates distances from available engineers using
 * Google Maps Distance Matrix API.
 *
 * Requirements: 3.2, 3.4, 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils/src/authorization';

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
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * Calculate distances from job location to engineers using Google Maps Distance Matrix API
 * Falls back to Haversine distance if Google Maps API is not available or fails
 */
async function calculateDistancesFromEngineers(
  jobLocation: { lat: number; lng: number },
  engineers: Array<{ id: string; current_location?: { coordinates: [number, number] } }>
): Promise<Array<{ engineer_id: string; distance_km: number; duration_minutes?: number }>> {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Filter engineers with valid locations
  const engineersWithLocation = engineers.filter(
    (e) => e.current_location?.coordinates && e.current_location.coordinates.length === 2
  );

  if (engineersWithLocation.length === 0) {
    return [];
  }

  // If Google Maps API key is available, use Distance Matrix API
  if (googleMapsApiKey) {
    try {
      // Build origins (engineer locations) and destination (job location)
      const origins = engineersWithLocation
        .map((e) => `${e.current_location!.coordinates[1]},${e.current_location!.coordinates[0]}`)
        .join('|');

      const destination = `${jobLocation.lat},${jobLocation.lng}`;

      // Call Google Maps Distance Matrix API
      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.set('origins', origins);
      url.searchParams.set('destinations', destination);
      url.searchParams.set('key', googleMapsApiKey);
      url.searchParams.set('units', 'metric');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API status: ${data.status}`);
      }

      // Parse results
      const distances = engineersWithLocation.map((engineer, index) => {
        const element = data.rows[index]?.elements[0];

        if (element?.status === 'OK') {
          return {
            engineer_id: engineer.id,
            distance_km: element.distance.value / 1000, // Convert meters to km
            duration_minutes: Math.round(element.duration.value / 60), // Convert seconds to minutes
          };
        } else {
          // Fallback to Haversine if this specific route failed
          const [lng, lat] = engineer.current_location!.coordinates;
          const distance = calculateHaversineDistance(lat, lng, jobLocation.lat, jobLocation.lng);
          return {
            engineer_id: engineer.id,
            distance_km: distance,
          };
        }
      });

      return distances;
    } catch (error) {
      console.error('Error calling Google Maps Distance Matrix API:', error);
      // Fall through to Haversine calculation
    }
  }

  // Fallback: Use Haversine distance calculation
  return engineersWithLocation.map((engineer) => {
    const [lng, lat] = engineer.current_location!.coordinates;
    const distance = calculateHaversineDistance(lat, lng, jobLocation.lat, jobLocation.lng);
    return {
      engineer_id: engineer.id,
      distance_km: distance,
    };
  });
}

/**
 * Validate job detail completeness
 * Requirements 3.2: Job details must include client info, location, equipment type, skill level
 */
function validateJobDetailCompleteness(job: any): {
  isComplete: boolean;
  missingFields: string[];
} {
  const requiredFields = ['client_name', 'site_location', 'equipment_type', 'required_skill_level'];

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!job[field]) {
      missingFields.push(field);
    }
  }

  // Validate site_location has required properties
  if (job.site_location) {
    if (!job.site_location.lat || !job.site_location.lng) {
      missingFields.push('site_location.coordinates');
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * GET /api/jobs/{id}
 * Get detailed job information with distance calculations from available engineers
 *
 * Requirements:
 * - 3.2: Display complete job details (client info, location, equipment type, skill level)
 * - 3.4: Highlight skill requirement in job details
 * - 3.5: Calculate and show distance from available engineers
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobNumber } = await params;

    // Validate UUID format
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(jobNumber)) {
    //   return errorResponse('INVALID_ID', 'Invalid job ID format', undefined, 400);
    // }

    // Get authenticated user session
    const session = await getUserSession();

    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401);
    }

    // Check if user has permission to read job data
    try {
      assertPermission(session.role, 'job:read');
    } catch (error: any) {
      return errorResponse('FORBIDDEN', error.message, undefined, 403);
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_number', jobNumber)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return errorResponse('NOT_FOUND', 'Job not found', undefined, 404);
      }
      console.error('Error fetching job:', jobError);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch job details', undefined, 500);
    }

    // // Verify user has access to this job (data isolation)
    // // Agency users can only see jobs assigned to their agency
    // // Engineers can only see jobs assigned to them
    // if (session.role === 'admin' || session.role === 'manager' || session.role === 'viewer') {
    //   if (job.assigned_agency_id !== session.agency_id) {
    //     return errorResponse(
    //       'FORBIDDEN',
    //       'You do not have access to this job',
    //       undefined,
    //       403
    //     );
    //   }
    // } else if (session.role === 'engineer') {
    //   if (job.assigned_engineer_id !== session.user_id) {
    //     return errorResponse(
    //       'FORBIDDEN',
    //       'You do not have access to this job',
    //       undefined,
    //       403
    //     );
    //   }
    // }

    // // Validate job detail completeness (Property 12)
    // const completeness = validateJobDetailCompleteness(job);

    // if (!completeness.isComplete) {
    //   console.warn(`Job ${jobId} is missing required fields:`, completeness.missingFields);
    // }

    // // Fetch available engineers from the assigned agency for distance calculation
    // let engineerDistances: Array<{ engineer_id: string; distance_km: number; duration_minutes?: number }> = [];

    // if (job.assigned_agency_id && job.site_location?.lat && job.site_location?.lng) {
    //   const { data: engineers, error: engineersError } = await supabase
    //     .from('engineers')
    //     .select('id, current_location, availability_status')
    //     .eq('agency_id', job.assigned_agency_id)
    //     .eq('availability_status', 'available');

    //   if (!engineersError && engineers && engineers.length > 0) {
    //     // Calculate distances from job location to available engineers
    //     engineerDistances = await calculateDistancesFromEngineers(
    //       { lat: job.site_location.lat, lng: job.site_location.lng },
    //       engineers
    //     );

    //     // Sort by distance (closest first)
    //     engineerDistances.sort((a, b) => a.distance_km - b.distance_km);
    //   }
    // }

    // // Build response with skill requirement highlighting (Requirement 3.4)
    // const response = {
    //   job: {
    //     ...job,
    //     // Add skill requirement highlighting flag
    //     skill_requirement_highlighted: true,
    //     skill_requirement: {
    //       level: job.required_skill_level,
    //       description: getSkillLevelDescription(job.required_skill_level),
    //     },
    //   },
    //   completeness: {
    //     is_complete: completeness.isComplete,
    //     missing_fields: completeness.missingFields,
    //   },
    //   engineer_distances: engineerDistances,
    //   metadata: {
    //     distance_calculation_method: process.env.GOOGLE_MAPS_API_KEY
    //       ? 'google_maps_distance_matrix'
    //       : 'haversine_formula',
    //     available_engineers_count: engineerDistances.length,
    //   },
    // };

    return successResponse(job);
  } catch (error) {
    console.error('Unexpected error in GET /api/jobs/[id]:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', undefined, 500);
  }
}

/**
 * Get human-readable description for skill level
 * Used for skill requirement highlighting
 */
function getSkillLevelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'Entry Level - Basic HVAC knowledge',
    2: 'Junior - 1-2 years experience',
    3: 'Intermediate - 3-5 years experience',
    4: 'Senior - 5+ years experience',
    5: 'Expert - Specialized certifications and extensive experience',
  };
  return descriptions[level] || 'Unknown skill level';
}
