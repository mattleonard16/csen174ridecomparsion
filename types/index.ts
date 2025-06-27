// Branded types for better type safety
export type Brand<K, T extends string> = K & { __brand: T }

// Location and coordinate types
export type Latitude = Brand<number, 'latitude'>
export type Longitude = Brand<number, 'longitude'>
export type Coordinates = [Longitude, Latitude]

// Price and currency types
export type PriceAmount = Brand<number, 'price'>
export type PriceString = Brand<string, 'priceString'>

// Service and ride types
export type ServiceType = 'uber' | 'lyft' | 'taxi'
export type RideService = Brand<string, 'rideService'>

// Location suggestion interface
export interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
  name?: string
  place_id?: string
}

// Ride comparison result interface
export interface RideResult {
  price: PriceString
  waitTime: string
  driversNearby: number
  service: RideService
  surgeMultiplier?: string
}

// Complete comparison results
export interface ComparisonResults {
  uber: RideResult
  lyft: RideResult
  taxi: RideResult
}

// Surge information
export interface SurgeInfo {
  isActive: boolean
  reason: string
  multiplier: number
}

// API response types
export interface ComparisonApiResponse {
  comparisons: ComparisonResults
  insights: string
  pickupCoords: Coordinates
  destinationCoords: Coordinates
  surgeInfo: SurgeInfo
  timeRecommendations: string[]
}

// Common places type
export interface CommonPlace {
  display_name: string
  name: string
  lat: string
  lon: string
}

export type CommonPlaces = Record<string, CommonPlace>
