import type { LocationSuggestion, Coordinates, Longitude, Latitude } from '@/types'
import { COMMON_PLACES, API_CONFIG } from './constants'

// Cache for API results
const searchCache = new Map<string, LocationSuggestion[]>()

// Nominatim API response interface
interface NominatimResult {
  place_id?: string | number
  display_name: string
  lat: string
  lon: string
  name?: string
}

/**
 * Search for places using common places first, then external API
 */
export async function searchPlaces(query: string): Promise<LocationSuggestion[]> {
  const normalizedQuery = query.toLowerCase().trim()

  // Check cache first
  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery)!
  }

  // Check common places first
  const commonMatches = Object.entries(COMMON_PLACES)
    .filter(
      ([key, place]) =>
        key.includes(normalizedQuery) ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.display_name.toLowerCase().includes(normalizedQuery)
    )
    .map(([key, place]) => ({
      place_id: key,
      display_name: place.display_name,
      lat: place.lat,
      lon: place.lon,
      name: place.name,
    }))

  if (commonMatches.length > 0) {
    searchCache.set(normalizedQuery, commonMatches)
    return commonMatches
  }

  // Fall back to external API if no common matches
  return searchWithNominatim(normalizedQuery)
}

/**
 * Search using OpenStreetMap Nominatim API
 */
async function searchWithNominatim(query: string): Promise<LocationSuggestion[]> {
  try {
    const url = `${API_CONFIG.NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&limit=${API_CONFIG.SEARCH_LIMIT}&countrycodes=us`

    const response = await fetch(url, {
      headers: {
        'User-Agent': API_CONFIG.USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data: NominatimResult[] = await response.json()
    const results = data.map((item: NominatimResult) => ({
      place_id: item.place_id?.toString(),
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      name: item.name || item.display_name.split(',')[0],
    }))

    // Cache the results
    searchCache.set(query.toLowerCase().trim(), results)

    return results
  } catch (error) {
    console.error('Error searching places:', error)
    return []
  }
}

/**
 * Get coordinates from address string
 */
export async function getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
  const url = `${API_CONFIG.NOMINATIM_BASE_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': API_CONFIG.USER_AGENT,
      },
    })

    const data = await response.json()

    if (!data || data.length === 0) return null

    const { lon, lat } = data[0]
    return [parseFloat(lon) as Longitude, parseFloat(lat) as Latitude]
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance and duration using OSRM API
 */
export async function getDistanceAndDuration(
  pickupCoords: Coordinates,
  destCoords: Coordinates
): Promise<{ distanceKm: number; durationMin: number }> {
  const [pickupLon, pickupLat] = pickupCoords
  const [destLon, destLat] = destCoords

  const url = `${API_CONFIG.OSRM_BASE_URL}/${pickupLon},${pickupLat};${destLon},${destLat}?overview=false`

  const response = await fetch(url)
  const data = await response.json()

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Failed to fetch route from OSRM')
  }

  const durationMin = data.routes[0].duration / 60 // seconds to minutes
  const distanceKm = data.routes[0].distance / 1000 // meters to kilometers

  return { distanceKm, durationMin }
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371
}

/**
 * Check if coordinates represent an airport location
 */
export function isAirportRoute(pickup: Coordinates, dest: Coordinates): boolean {
  const sfoCoords: Coordinates = [-122.3839894 as Longitude, 37.622452 as Latitude]
  const tolerance = 0.05

  return (
    (Math.abs(pickup[0] - sfoCoords[0]) < tolerance &&
      Math.abs(pickup[1] - sfoCoords[1]) < tolerance) ||
    (Math.abs(dest[0] - sfoCoords[0]) < tolerance && Math.abs(dest[1] - sfoCoords[1]) < tolerance)
  )
}
