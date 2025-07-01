import type { CommonPlaces } from '@/types'
import { AIRPORTS } from './airports'

// Common places for faster autocomplete
export const COMMON_PLACES: CommonPlaces = {
  'santa clara university': {
    display_name: 'Santa Clara University, Santa Clara, CA, USA',
    name: 'Santa Clara University',
    lat: '37.3496',
    lon: '-121.9390',
  },
  'san jose airport': {
    display_name: 'San Jose International Airport (SJC), San Jose, CA, USA',
    name: 'San Jose Airport (SJC)',
    lat: '37.3639',
    lon: '-121.9289',
  },
  sjc: {
    display_name: 'San Jose International Airport (SJC), San Jose, CA, USA',
    name: 'San Jose Airport (SJC)',
    lat: '37.3639',
    lon: '-121.9289',
  },
  sfo: {
    display_name: 'San Francisco International Airport (SFO), San Francisco, CA, USA',
    name: 'San Francisco Airport (SFO)',
    lat: '37.6213',
    lon: '-122.3790',
  },
  'san francisco airport': {
    display_name: 'San Francisco International Airport (SFO), San Francisco, CA, USA',
    name: 'San Francisco Airport (SFO)',
    lat: '37.6213',
    lon: '-122.3790',
  },
  'oakland airport': {
    display_name: 'Oakland International Airport (OAK), Oakland, CA, USA',
    name: 'Oakland Airport (OAK)',
    lat: '37.7126',
    lon: '-122.2197',
  },
  oak: {
    display_name: 'Oakland International Airport (OAK), Oakland, CA, USA',
    name: 'Oakland Airport (OAK)',
    lat: '37.7126',
    lon: '-122.2197',
  },
  'stanford university': {
    display_name: 'Stanford University, Stanford, CA, USA',
    name: 'Stanford University',
    lat: '37.4275',
    lon: '-122.1697',
  },
  cupertino: {
    display_name: 'Cupertino, CA, USA',
    name: 'Cupertino',
    lat: '37.3230',
    lon: '-122.0322',
  },
  'apple park': {
    display_name: 'Apple Park, Cupertino, CA, USA',
    name: 'Apple Park',
    lat: '37.3349',
    lon: '-122.0090',
  },
  google: {
    display_name: 'Googleplex, Mountain View, CA, USA',
    name: 'Google Headquarters',
    lat: '37.4220',
    lon: '-122.0841',
  },
  'mountain view': {
    display_name: 'Mountain View, CA, USA',
    name: 'Mountain View',
    lat: '37.3861',
    lon: '-122.0839',
  },
  'palo alto': {
    display_name: 'Palo Alto, CA, USA',
    name: 'Palo Alto',
    lat: '37.4419',
    lon: '-122.1430',
  },
  'san jose': {
    display_name: 'San Jose, CA, USA',
    name: 'San Jose',
    lat: '37.3382',
    lon: '-121.8863',
  },
  'santa clara': {
    display_name: 'Santa Clara, CA, USA',
    name: 'Santa Clara',
    lat: '37.3541',
    lon: '-121.9552',
  },
  sunnyvale: {
    display_name: 'Sunnyvale, CA, USA',
    name: 'Sunnyvale',
    lat: '37.3688',
    lon: '-122.0363',
  },
  fremont: {
    display_name: 'Fremont, CA, USA',
    name: 'Fremont',
    lat: '37.5485',
    lon: '-121.9886',
  },
  'san francisco': {
    display_name: 'San Francisco, CA, USA',
    name: 'San Francisco',
    lat: '37.7749',
    lon: '-122.4194',
  },
  'downtown san jose': {
    display_name: 'Downtown San Jose, San Jose, CA, USA',
    name: 'Downtown San Jose',
    lat: '37.3382',
    lon: '-121.8863',
  },
}

// Dynamically add airport entries to COMMON_PLACES
for (const airport of AIRPORTS) {
  const display = `${airport.name} (${airport.code}), ${airport.city}, ${airport.state}, USA`
  const entry = {
    display_name: display,
    name: `${airport.name} (${airport.code})`,
    lat: airport.lat.toString(),
    lon: airport.lon.toString(),
  }
  // add key by IATA code and all synonyms
  COMMON_PLACES[airport.code.toLowerCase()] = entry
  for (const keyword of airport.synonyms) {
    COMMON_PLACES[keyword.toLowerCase()] = entry
  }
}

// Pricing constants for rideshare services
export const PRICING_CONFIG = {
  UBER: {
    base: 1.25,
    perMile: 1.08,
    perMin: 0.28,
    booking: 0.85,
    airportSurcharge: 4.25,
    minFare: 8.5,
  },
  LYFT: {
    base: 1.2,
    perMile: 1.15,
    perMin: 0.3,
    booking: 0.85,
    airportSurcharge: 4.0,
    minFare: 8.25,
  },
  TAXI: {
    base: 3.5,
    perMile: 2.75,
    perMin: 0.55,
    booking: 0.0,
    airportSurcharge: 5.0,
    minFare: 12.0,
  },
} as const

// API endpoints and configuration
export const API_CONFIG = {
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org/search',
  OSRM_BASE_URL: 'http://router.project-osrm.org/route/v1/driving',
  USER_AGENT: 'RideCompareApp/1.0 (bjwmyjackwu@gmail.com)',
  SEARCH_LIMIT: 5,
  CACHE_TTL: 300000, // 5 minutes in milliseconds
} as const

// UI constants
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_SUGGESTIONS: 5,
  LOADING_TIMEOUT: 10000, // 10 seconds
} as const
