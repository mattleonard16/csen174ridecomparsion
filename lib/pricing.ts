import type { Coordinates, ServiceType } from '@/types'
import { PRICING_CONFIG } from './constants'
import { kmToMiles } from './location'
import { isAirportLocation } from './airports'

/**
 * Calculate realistic surge multiplier based on time and location
 */
export function getTimeBasedMultiplier(
  pickupCoords: Coordinates,
  destCoords: Coordinates
): { multiplier: number; surgeReason: string } {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = day === 0 || day === 6

  // Check if this is a high-demand route (airports, major venues)
  const isAirportRoute = isAirportLocation(pickupCoords) !== null || isAirportLocation(destCoords) !== null

  // Base surge probability - most of the time there's no surge
  let surgeProbability = 0.2 // Only 20% chance of surge normally
  let rushFactor = 1.0
  let timeReason = 'Standard pricing'

  // Increase surge probability during actual high-demand times
  if (!isWeekend && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19))) {
    surgeProbability = 0.4 // 40% chance during rush hour
    rushFactor = 1.3
    timeReason = 'Rush hour demand'
  }
  // Weekend evening (higher surge probability)
  else if ((day === 5 || day === 6) && (hour >= 20 || hour <= 2)) {
    surgeProbability = 0.6 // 60% chance weekend nights
    rushFactor = 1.4
    timeReason = 'Weekend nightlife demand'
  }
  // Late night (moderate increase)
  else if (hour >= 23 || hour <= 5) {
    surgeProbability = 0.3 // 30% chance late night
    rushFactor = 1.25
    timeReason = 'Late night premium'
  }

  // Airport routes have higher surge probability
  if (isAirportRoute) {
    surgeProbability += 0.2
  }

  // Random factor to determine if surge is actually active
  const shouldHaveSurge = Math.random() < surgeProbability

  if (!shouldHaveSurge) {
    return {
      multiplier: 1.0,
      surgeReason: 'Standard pricing',
    }
  }

  // If surge is active, calculate the multiplier
  const driversNearby = Math.floor(2 + Math.random() * 6) // 2-8 drivers
  const supplyFactor = 1 + Math.max(0, 5 - driversNearby) * 0.06

  // More conservative surge cap (usually 1.2x-1.4x, rarely higher)
  const surgeFactor = Math.min(rushFactor * supplyFactor, 1.5)

  // Generate descriptive reason
  let surgeReason = timeReason
  if (supplyFactor > 1.05) {
    surgeReason += ' + low driver availability'
  }

  return {
    multiplier: surgeFactor,
    surgeReason: surgeReason,
  }
}

/**
 * Generate best time recommendations based on current time
 */
export function getBestTimeRecommendations(): string[] {
  const now = new Date()
  const hour = now.getHours()

  // Show only 2 most relevant tips based on current time
  if (hour >= 14 && hour <= 16) {
    return [
      "Great timing! You're booking during off-peak hours with 10% discount",
      'Best prices are typically 2-4 PM (avoid rush hours for savings)',
    ]
  } else if (hour >= 7 && hour <= 9) {
    return [
      'Rush hour pricing in effect. Expect 20-40% increase over standard rates',
      'Best prices: 2-4 PM (5% discount during off-peak)',
    ]
  } else if (hour >= 17 && hour <= 19) {
    return [
      'Evening rush pricing. Consider waiting until after 8 PM for better rates',
      'Best prices: 2-4 PM (5% discount during off-peak)',
    ]
  } else if (hour >= 20 || hour <= 5) {
    return [
      'Late night premium in effect (30% increase for night service)',
      'Best prices: 2-4 PM (avoid peak hours for savings)',
    ]
  } else {
    return [
      'Best prices: 2-4 PM (5% discount during off-peak)',
      'Avoid rush hours: 7-9 AM and 5-7 PM (up to 40% increase)',
    ]
  }
}

/**
 * Calculate fare for a specific service
 */
export function calculateFare(
  service: ServiceType,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier: number = 1.0
): number {
  const config = PRICING_CONFIG[service.toUpperCase() as keyof typeof PRICING_CONFIG]
  const distanceMiles = kmToMiles(distanceKm)

  const baseFare =
    config.base + distanceMiles * config.perMile + durationMin * config.perMin + config.booking

  const fareWithSurge = baseFare * surgeMultiplier

  return Math.max(fareWithSurge, config.minFare)
}

/**
 * Check if route involves an airport for surcharge calculation (updated to use new airport database)
 */
export function hasAirportSurcharge(pickup: Coordinates, dest: Coordinates): boolean {
  return isAirportLocation(pickup) !== null || isAirportLocation(dest) !== null
}
