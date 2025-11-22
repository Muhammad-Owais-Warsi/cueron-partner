/**
 * Real-time Location Tracking
 * Handles engineer location updates and broadcasting
 * 
 * Requirement 6.2: Location tracking activation on 'travelling' status
 * Requirement 9.1: Periodic location updates every 30 seconds
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cueron/types';

export interface LocationUpdate {
  engineer_id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  accuracy?: number;
}

export interface LocationTrackingOptions {
  updateInterval?: number; // milliseconds, default 30000 (30 seconds)
  highAccuracy?: boolean; // default true
  timeout?: number; // milliseconds, default 10000
  maximumAge?: number; // milliseconds, default 0
}

/**
 * Location Tracking Manager
 * Manages periodic location updates for engineers on jobs
 */
export class LocationTrackingManager {
  private supabase: SupabaseClient<Database>;
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private watchIds: Map<string, number> = new Map();
  private isTracking: Map<string, boolean> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Start location tracking for an engineer
   * Requirement 6.2: Activate tracking when status changes to 'travelling'
   * Requirement 9.1: Update location every 30 seconds
   */
  async startTracking(
    engineerId: string,
    jobId: string,
    options: LocationTrackingOptions = {}
  ): Promise<void> {
    // Check if already tracking
    if (this.isTracking.get(engineerId)) {
      console.log(`Already tracking engineer ${engineerId}`);
      return;
    }

    const {
      updateInterval = 30000, // 30 seconds
      highAccuracy = true,
      timeout = 10000,
      maximumAge = 0,
    } = options;

    // Check if geolocation is available
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.isTracking.set(engineerId, true);

    // Function to update location
    const updateLocation = async () => {
      try {
        const position = await this.getCurrentPosition({
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge,
        });

        const locationUpdate: LocationUpdate = {
          engineer_id: engineerId,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy,
        };

        // Update engineer location in database
        await this.updateEngineerLocation(locationUpdate);

        // Broadcast location update to job channel
        await this.broadcastLocationUpdate(jobId, locationUpdate);

        console.log(`Location updated for engineer ${engineerId}`, locationUpdate);
      } catch (error) {
        console.error(`Error updating location for engineer ${engineerId}:`, error);
        // Don't stop tracking on error, just log it
      }
    };

    // Initial location update
    await updateLocation();

    // Set up periodic updates
    const intervalId = setInterval(updateLocation, updateInterval);
    this.trackingIntervals.set(engineerId, intervalId);

    console.log(`Started location tracking for engineer ${engineerId} with ${updateInterval}ms interval`);
  }

  /**
   * Stop location tracking for an engineer
   */
  stopTracking(engineerId: string): void {
    // Clear interval
    const intervalId = this.trackingIntervals.get(engineerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.trackingIntervals.delete(engineerId);
    }

    // Clear watch
    const watchId = this.watchIds.get(engineerId);
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
      this.watchIds.delete(engineerId);
    }

    this.isTracking.set(engineerId, false);
    console.log(`Stopped location tracking for engineer ${engineerId}`);
  }

  /**
   * Check if currently tracking an engineer
   */
  isTrackingEngineer(engineerId: string): boolean {
    return this.isTracking.get(engineerId) || false;
  }

  /**
   * Get current position using Geolocation API
   */
  private getCurrentPosition(
    options: PositionOptions
  ): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Update engineer location in database
   */
  private async updateEngineerLocation(update: LocationUpdate): Promise<void> {
    const { error } = await this.supabase
      .from('engineers')
      .update({
        current_location: {
          type: 'Point',
          coordinates: [update.location.lng, update.location.lat],
        },
        last_location_update: update.timestamp,
      })
      .eq('id', update.engineer_id);

    if (error) {
      console.error('Error updating engineer location in database:', error);
      throw error;
    }
  }

  /**
   * Broadcast location update to job channel
   * Requirement 6.4: Real-time broadcast
   */
  private async broadcastLocationUpdate(
    jobId: string,
    update: LocationUpdate
  ): Promise<void> {
    const channel = this.supabase.channel(`job:${jobId}`);

    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: {
        engineer_id: update.engineer_id,
        location: update.location,
        timestamp: update.timestamp,
        accuracy: update.accuracy,
      },
    });
  }

  /**
   * Stop all tracking
   * Should be called on logout or app termination
   */
  stopAllTracking(): void {
    const engineerIds = Array.from(this.trackingIntervals.keys());
    engineerIds.forEach((engineerId) => this.stopTracking(engineerId));
  }

  /**
   * Get tracking status for all engineers
   */
  getTrackingStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.isTracking.forEach((tracking, engineerId) => {
      status[engineerId] = tracking;
    });
    return status;
  }
}

/**
 * Singleton instance for location tracking
 */
let locationTrackingManager: LocationTrackingManager | null = null;

export function getLocationTrackingManager(
  supabase: SupabaseClient<Database>
): LocationTrackingManager {
  if (!locationTrackingManager) {
    locationTrackingManager = new LocationTrackingManager(supabase);
  }
  return locationTrackingManager;
}

/**
 * Reset location tracking manager (useful for testing or logout)
 */
export function resetLocationTrackingManager(): void {
  if (locationTrackingManager) {
    locationTrackingManager.stopAllTracking();
  }
  locationTrackingManager = null;
}
