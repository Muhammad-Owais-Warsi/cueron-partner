// Common types used across the platform

export type UUID = string;

export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  address: string;
  city: string;
  state: string;
  pincode?: string;
  lat: number;
  lng: number;
}

export interface PostGISPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export type Timestamp = Date | string;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  request_id: string;
}
