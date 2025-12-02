/**
 * Offline handling utilities for mobile app
 * Provides network status detection and offline queue management
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AppError, ErrorCode } from '@repo/utils/errors'; // TODO: Implement error utils

const OFFLINE_QUEUE_KEY = '@cueron/offline_queue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

/**
 * Network status manager
 */
class NetworkManager {
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;

    // Subscribe to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners if status changed
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    });
  }

  /**
   * Check if device is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.isOnline);
    });
  }
}

/**
 * Offline queue manager
 */
class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add request to queue
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Remove request from queue
   */
  private async removeRequest(id: string): Promise<void> {
    this.queue = this.queue.filter((req) => req.id !== id);
    await this.saveQueue();
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const requests = [...this.queue];

      for (const request of requests) {
        try {
          // Attempt to execute the request
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (response.ok) {
            // Success - remove from queue
            await this.removeRequest(request.id);
          } else if (response.status >= 400 && response.status < 500) {
            // Client error - remove from queue (won't succeed on retry)
            await this.removeRequest(request.id);
          } else {
            // Server error - increment retry count
            request.retryCount++;
            if (request.retryCount >= 3) {
              // Max retries reached - remove from queue
              await this.removeRequest(request.id);
            }
          }
        } catch (error) {
          // Network error - keep in queue for next attempt
          console.error('Failed to process queued request:', error);
        }
      }

      await this.saveQueue();
    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton instances
export const networkManager = new NetworkManager();
export const offlineQueue = new OfflineQueue();

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return networkManager.getIsOnline();
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(
  listener: (isOnline: boolean) => void
): () => void {
  return networkManager.subscribe(listener);
}

/**
 * Queue request for later execution when online
 */
export async function queueRequest(
  url: string,
  method: string,
  body?: any,
  headers?: Record<string, string>
): Promise<void> {
  await offlineQueue.enqueue({ url, method, body, headers });
}

/**
 * Get number of queued requests
 */
export function getQueuedRequestCount(): number {
  return offlineQueue.getSize();
}

/**
 * Process all queued requests
 */
export async function processQueuedRequests(): Promise<void> {
  if (isOnline()) {
    await offlineQueue.processQueue();
  }
}

/**
 * Clear all queued requests
 */
export async function clearQueue(): Promise<void> {
  await offlineQueue.clear();
}

/**
 * Initialize offline handling
 * Should be called when app starts
 */
export function initializeOfflineHandling(): void {
  // Process queue when coming online
  subscribeToNetworkStatus((online) => {
    if (online) {
      processQueuedRequests();
    }
  });

  // Process queue on app start if online
  if (isOnline()) {
    processQueuedRequests();
  }
}
