import type { Coordinates, ServiceType } from '@/types'
import { kmToMiles } from './location'
import { isAirportLocation } from './airports'
import pricingConfig from './pricing-config.json'

// Type definitions for pricing config
type TimeSlot = string
type SurgeSchedule = Record<TimeSlot, number>

interface PricingConfigType {
  services: {
    [key: string]: {
      base: number
      perMile: number
      perMin: number
      booking: number
      safetyFee: number
      minFare: number
      maxSurge: number
      airportPickupFee: number
      airportDropoffFee: number
      cbdSurcharge: number
      longRideFee: {
        threshold: number
        fee: number
      }
    }
  }
  surgeSchedule: {
    weekday: SurgeSchedule
    weekend: SurgeSchedule
  }
  locationModifiers: {
    airports: Record<string, number>
    downtown: Record<string, number>
    suburbs: Record<string, number>
  }
  trafficModifiers: Record<string, number>
  specialDates: Record<string, number>
}

// Enhanced pricing interfaces
interface PricingInput {
  service: ServiceType
  pickupCoords: Coordinates
  destCoords: Coordinates
  distanceKm: number
  durationMin: number
  timestamp?: Date
  osrmDurationSec?: number
  expectedDurationSec?: number
}

interface PricingBreakdown {
  baseFare: number
  distanceFee: number
  timeFee: number
  bookingFee: number
  safetyFee: number
  airportFees: number
  locationSurcharge: number
  longRideFee: number
  subtotal: number
  surgeMultiplier: number
  surgeFee: number
  trafficMultiplier: number
  trafficFee: number
  finalFare: number
  appliedMinFare: boolean
}

interface PricingResult {
  price: string
  breakdown: PricingBreakdown
  surgeReason: string
  confidence: number // 0-1, how confident we are in this estimate
}

/**
 * Enhanced pricing engine with fine-grained surge, location factors, and traffic
 */
export class EnhancedPricingEngine {
  private config = pricingConfig as PricingConfigType
  private isDebug = process.env.NODE_ENV === 'development'

  /**
   * Calculate fare with full breakdown and accuracy improvements
   */
  calculateFare(input: PricingInput): PricingResult {
    const timestamp = input.timestamp || new Date()
    const serviceConfig = this.getServiceConfig(input.service)
    
    if (this.isDebug) {
      console.debug('🚖 Enhanced Pricing Calculation:', {
        service: input.service,
        distance: `${input.distanceKm.toFixed(2)}km`,
        duration: `${input.durationMin.toFixed(1)}min`,
        pickup: input.pickupCoords,
        destination: input.destCoords,
        timestamp: timestamp.toISOString()
      })
    }

    // 1. Calculate base components
    const distanceMiles = kmToMiles(input.distanceKm)
    const baseFare = serviceConfig.base
    const distanceFee = distanceMiles * serviceConfig.perMile
    const timeFee = input.durationMin * serviceConfig.perMin
    const bookingFee = serviceConfig.booking
    const safetyFee = serviceConfig.safetyFee || 0

    // 2. Calculate location-based fees
    const airportFees = this.calculateAirportFees(input.pickupCoords, input.destCoords, serviceConfig)
    const locationSurcharge = this.calculateLocationSurcharge(input.pickupCoords, input.destCoords, timestamp, serviceConfig)
    const longRideFee = this.calculateLongRideFee(input.distanceKm, serviceConfig)

    // 3. Calculate subtotal before surge
    const subtotal = baseFare + distanceFee + timeFee + bookingFee + safetyFee + airportFees + locationSurcharge + longRideFee

    // 4. Calculate surge multiplier (30-minute granularity)
    const { multiplier: surgeMultiplier, reason: surgeReason } = this.calculateSurgeMultiplier(
      input.pickupCoords,
      input.destCoords,
      timestamp
    )

    // 5. Calculate traffic multiplier
    const trafficMultiplier = this.calculateTrafficMultiplier(
      input.osrmDurationSec,
      input.expectedDurationSec,
      timestamp
    )

    // 6. Apply multipliers
    const surgeFee = subtotal * (surgeMultiplier - 1)
    const trafficFee = subtotal * (trafficMultiplier - 1)
    let finalFare = subtotal + surgeFee + trafficFee

    // 7. Apply minimum fare
    const appliedMinFare = finalFare < serviceConfig.minFare
    if (appliedMinFare) {
      finalFare = serviceConfig.minFare
    }

    // 8. Calculate confidence based on factors
    const confidence = this.calculateConfidence(input, surgeMultiplier, trafficMultiplier)

    const breakdown: PricingBreakdown = {
      baseFare,
      distanceFee,
      timeFee,
      bookingFee,
      safetyFee,
      airportFees,
      locationSurcharge,
      longRideFee,
      subtotal,
      surgeMultiplier,
      surgeFee,
      trafficMultiplier,
      trafficFee,
      finalFare,
      appliedMinFare
    }

    if (this.isDebug) {
      console.debug('💰 Pricing Breakdown:', {
        service: input.service,
        breakdown,
        surgeReason,
        confidence: `${(confidence * 100).toFixed(1)}%`
      })
    }

    return {
      price: `$${finalFare.toFixed(2)}`,
      breakdown,
      surgeReason,
      confidence
    }
  }

  /**
   * Get service configuration with proper typing
   */
  private getServiceConfig(service: ServiceType) {
    const serviceKey = service.toLowerCase() as keyof typeof this.config.services
    return this.config.services[serviceKey]
  }

  /**
   * Calculate airport pickup/dropoff fees
   */
  private calculateAirportFees(pickup: Coordinates, dest: Coordinates, config: any): number {
    const isPickupAirport = isAirportLocation(pickup) !== null
    const isDestAirport = isAirportLocation(dest) !== null

    let total = 0
    if (isPickupAirport) total += config.airportPickupFee || 0
    if (isDestAirport) total += config.airportDropoffFee || 0

    return total
  }

  /**
   * Calculate location-based surcharges (CBD, downtown, etc.)
   */
  private calculateLocationSurcharge(pickup: Coordinates, dest: Coordinates, timestamp: Date, config: any): number {
    // Simplified downtown detection for SF Bay Area
    const isDowntown = (coords: Coordinates): boolean => {
      const [lon, lat] = coords
      // SF Financial District
      if (lat >= 37.785 && lat <= 37.805 && lon >= -122.415 && lon <= -122.395) return true
      // Downtown SJ
      if (lat >= 37.325 && lat <= 37.345 && lon >= -121.895 && lon <= -121.875) return true
      return false
    }

    const hour = timestamp.getHours()
    const isBusinessHours = hour >= 9 && hour <= 17
    const isNightlife = hour >= 20 || hour <= 2

    if (isDowntown(pickup) || isDowntown(dest)) {
      if (isBusinessHours) return config.cbdSurcharge * 0.5 // 50% of full surcharge during business
      if (isNightlife) return config.cbdSurcharge * 1.2 // 120% during nightlife
      return config.cbdSurcharge || 0
    }

    return 0
  }

  /**
   * Calculate long ride fees
   */
  private calculateLongRideFee(distanceKm: number, config: any): number {
    const distanceMiles = kmToMiles(distanceKm)
    if (distanceMiles >= config.longRideFee?.threshold) {
      return config.longRideFee.fee || 0
    }
    return 0
  }

  /**
   * Calculate 30-minute granular surge multiplier
   */
  private calculateSurgeMultiplier(
    pickup: Coordinates,
    dest: Coordinates,
    timestamp: Date
  ): { multiplier: number; reason: string } {
    const hour = timestamp.getHours()
    const minute = timestamp.getMinutes()
    const day = timestamp.getDay() // 0 = Sunday
    const isWeekend = day === 0 || day === 6

    // Get 30-minute time slot
    const timeSlot = this.getTimeSlot(hour, minute)
    const scheduleType = isWeekend ? 'weekend' : 'weekday'
    
    // Base surge from schedule
    const scheduleData = this.config.surgeSchedule[scheduleType as keyof typeof this.config.surgeSchedule]
    let baseSurge = (scheduleData as SurgeSchedule)[timeSlot] || 1.0

    // Location modifiers
    const isAirportRoute = isAirportLocation(pickup) !== null || isAirportLocation(dest) !== null
    const isLateNight = hour >= 23 || hour <= 5
    const isPeakHours = (!isWeekend && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)))

    let locationMultiplier = 1.0
    let reason = 'Standard pricing'

    if (isAirportRoute) {
      if (isLateNight) {
        locationMultiplier = this.config.locationModifiers.airports.lateNight
        reason = 'Late night airport premium'
      } else if (isPeakHours) {
        locationMultiplier = this.config.locationModifiers.airports.peakHours
        reason = 'Peak hours airport demand'
      } else {
        reason = 'Airport route'
      }
    } else if (isLateNight) {
      reason = 'Late night premium'
    } else if (isPeakHours) {
      reason = 'Rush hour demand'
    }

    // Special date modifiers
    const specialMultiplier = this.getSpecialDateMultiplier(timestamp)
    if (specialMultiplier > 1) {
      reason = 'Holiday surge pricing'
    }

    const finalMultiplier = Math.min(
      baseSurge * locationMultiplier * specialMultiplier,
      3.0 // Cap surge at 3x
    )

    if (this.isDebug) {
      console.debug('⚡ Surge Calculation:', {
        timeSlot,
        scheduleType,
        baseSurge,
        locationMultiplier,
        specialMultiplier,
        finalMultiplier,
        reason
      })
    }

    return { multiplier: finalMultiplier, reason }
  }

  /**
   * Get 30-minute time slot key
   */
  private getTimeSlot(hour: number, minute: number): string {
    const slotMinute = minute < 30 ? '00' : '30'
    const nextHour = minute < 30 ? hour : (hour + 1) % 24
    const nextSlotMinute = minute < 30 ? '30' : '00'
    
    return `${hour.toString().padStart(2, '0')}:${slotMinute}-${nextHour.toString().padStart(2, '0')}:${nextSlotMinute}`
  }

  /**
   * Calculate traffic multiplier based on OSRM vs expected duration
   */
  private calculateTrafficMultiplier(
    osrmDurationSec?: number,
    expectedDurationSec?: number,
    timestamp?: Date
  ): number {
    if (!osrmDurationSec || !expectedDurationSec) return 1.0

    const trafficRatio = osrmDurationSec / expectedDurationSec
    
    if (trafficRatio <= 1.1) return this.config.trafficModifiers.light
    if (trafficRatio <= 1.3) return this.config.trafficModifiers.moderate
    if (trafficRatio <= 1.6) return this.config.trafficModifiers.heavy
    return this.config.trafficModifiers.severe
  }

  /**
   * Get special date multiplier
   */
  private getSpecialDateMultiplier(timestamp: Date): number {
    const month = timestamp.getMonth() + 1
    const date = timestamp.getDate()

    // New Year's Eve
    if (month === 12 && date === 31) return this.config.specialDates.newYearsEve
    // Halloween
    if (month === 10 && date === 31) return this.config.specialDates.halloween
    // July 4th
    if (month === 7 && date === 4) return this.config.specialDates.fourthOfJuly

    return 1.0
  }

  /**
   * Calculate confidence score for the estimate
   */
  private calculateConfidence(
    input: PricingInput,
    surgeMultiplier: number,
    trafficMultiplier: number
  ): number {
    let confidence = 0.9 // Start with high confidence

    // Reduce confidence for high surge
    if (surgeMultiplier > 2.0) confidence -= 0.15
    else if (surgeMultiplier > 1.5) confidence -= 0.1

    // Reduce confidence for high traffic
    if (trafficMultiplier > 1.3) confidence -= 0.1

    // Reduce confidence for very long trips (more variables)
    if (input.distanceKm > 50) confidence -= 0.15
    else if (input.distanceKm > 25) confidence -= 0.1

    // Reduce confidence late at night (more unpredictable)
    const hour = (input.timestamp || new Date()).getHours()
    if (hour >= 1 && hour <= 5) confidence -= 0.1

    return Math.max(confidence, 0.5) // Never go below 50% confidence
  }
}

// Export singleton instance
export const pricingEngine = new EnhancedPricingEngine()

// Legacy compatibility functions
export function calculateEnhancedFare(
  service: ServiceType,
  pickupCoords: Coordinates,
  destCoords: Coordinates,
  distanceKm: number,
  durationMin: number,
  timestamp?: Date
): PricingResult {
  return pricingEngine.calculateFare({
    service,
    pickupCoords,
    destCoords,
    distanceKm,
    durationMin,
    timestamp
  })
}

export function getEnhancedSurgeMultiplier(
  pickupCoords: Coordinates,
  destCoords: Coordinates,
  timestamp?: Date
): { multiplier: number; surgeReason: string } {
  const result = pricingEngine.calculateFare({
    service: 'uber',
    pickupCoords,
    destCoords,
    distanceKm: 10, // dummy values for surge calculation
    durationMin: 15,
    timestamp
  })
  
  return {
    multiplier: result.breakdown.surgeMultiplier,
    surgeReason: result.surgeReason
  }
} 