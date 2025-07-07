import type { Coordinates, ServiceType } from '@/types'
import { PRICING_CONFIG } from './constants'
import { kmToMiles } from './location'
import { isAirportLocation } from './airports'

// CALIBRATED pricing configuration based on accuracy testing
const ENHANCED_CONFIG = {
  services: {
          uber: {
        base: 2.25,
        perMile: 1.12,
        perMin: 0.30,
        booking: 1.65,
        safetyFee: 0.75,
        minFare: 9.25,
        airportPickupFee: 3.00,
        airportDropoffFee: 2.00,
        cbdSurcharge: 2.25,
        longRideFee: { threshold: 35, fee: 0.00 },
        sjcFee: { pickup: 5.50, dropoff: 5.50 }
      },
    lyft: {
      base: 2.65,
      perMile: 1.48,
      perMin: 0.38,
      booking: 1.45,
      safetyFee: 0.65,
      minFare: 8.95,
      airportPickupFee: 6.25,
      airportDropoffFee: 3.00,
      cbdSurcharge: 3.25,
      longRideFee: { threshold: 25, fee: 5.25 }
    },
    taxi: {
      base: 4.25,
      perMile: 3.15,
      perMin: 0.65,
      booking: 0.0,
      safetyFee: 0.0,
      minFare: 15.0,
      airportPickupFee: 6.50,
      airportDropoffFee: 0.0,
      cbdSurcharge: 3.00,
      longRideFee: { threshold: 30, fee: 5.00 }
    }
  },
  surgeSchedule: {
    weekday: {
      6: 1.1, 7: 1.25, 8: 1.45, 9: 1.25,
      17: 1.25, 18: 1.55, 19: 1.35,
      23: 1.25, 0: 1.25, 1: 1.15, 2: 1.15
    },
    weekend: {
      10: 1.05, 12: 1.1, 14: 1.05,
      18: 1.15, 20: 1.35, 22: 1.65, 0: 1.85, 1: 1.85, 2: 1.45
    }
  },
  locationModifiers: {
    airports: { lateNight: 1.25, peakHours: 1.35 },
    downtown: { businessHours: 1.15, nightlife: 1.35 }
  }
}

/**
 * Enhanced surge calculation with 1-hour granularity and deterministic factors
 */
export function getTimeBasedMultiplier(
  pickupCoords: Coordinates,
  destCoords: Coordinates,
  timestamp?: Date
): { multiplier: number; surgeReason: string } {
  const now = timestamp || new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = day === 0 || day === 6

  const isDebug = process.env.NODE_ENV === 'development'
  
  if (isDebug) {
    console.debug('⚡ Enhanced Surge Calculation:', {
      hour,
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
      isWeekend,
      pickup: pickupCoords,
      destination: destCoords
    })
  }

  // Get base surge from schedule
  const scheduleType = isWeekend ? 'weekend' : 'weekday'
  const schedule = ENHANCED_CONFIG.surgeSchedule[scheduleType]
  let baseSurge = schedule[hour as keyof typeof schedule] || 1.0

  // Location-based modifiers
  const isAirportRoute = isAirportLocation(pickupCoords) !== null || isAirportLocation(destCoords) !== null
  const isLateNight = hour >= 23 || hour <= 5
  const isPeakHours = (!isWeekend && ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)))

  let locationMultiplier = 1.0
  let reason = 'Standard pricing'

  if (isAirportRoute) {
    if (isLateNight) {
      locationMultiplier = ENHANCED_CONFIG.locationModifiers.airports.lateNight
      reason = 'Late night airport premium'
    } else if (isPeakHours) {
      locationMultiplier = ENHANCED_CONFIG.locationModifiers.airports.peakHours
      reason = 'Peak hours airport demand'
    } else {
      reason = 'Airport route'
    }
  } else if (isLateNight) {
    reason = 'Late night premium'
  } else if (isPeakHours) {
    reason = 'Rush hour demand'
  }

  // Downtown surcharge detection
  const isDowntown = (coords: Coordinates): boolean => {
    const [lon, lat] = coords
    // SF Financial District
    if (lat >= 37.785 && lat <= 37.805 && lon >= -122.415 && lon <= -122.395) return true
    // Downtown SJ
    if (lat >= 37.325 && lat <= 37.345 && lon >= -121.895 && lon <= -121.875) return true
    return false
  }

  if (isDowntown(pickupCoords) || isDowntown(destCoords)) {
    const isBusinessHours = hour >= 9 && hour <= 17
    const isNightlife = hour >= 20 || hour <= 2
    
    if (isBusinessHours) {
      locationMultiplier *= ENHANCED_CONFIG.locationModifiers.downtown.businessHours
      reason = reason === 'Standard pricing' ? 'Downtown business hours' : reason + ' + downtown'
    } else if (isNightlife) {
      locationMultiplier *= ENHANCED_CONFIG.locationModifiers.downtown.nightlife
      reason = reason === 'Standard pricing' ? 'Downtown nightlife' : reason + ' + nightlife'
    }
  }

  const finalMultiplier = Math.min(baseSurge * locationMultiplier, 3.0) // Cap at 3x

  if (isDebug) {
    console.debug('💰 Surge Result:', {
      baseSurge,
      locationMultiplier,
      finalMultiplier,
      reason
    })
  }

  return { multiplier: finalMultiplier, surgeReason: reason }
}

/**
 * Enhanced fare calculation with all new components
 */
export function calculateFare(
  service: ServiceType,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier: number = 1.0,
  pickupCoords?: Coordinates,
  destCoords?: Coordinates,
  timestamp?: Date
): number {
  const serviceKey = service.toLowerCase() as keyof typeof ENHANCED_CONFIG.services
  const config = ENHANCED_CONFIG.services[serviceKey] || ENHANCED_CONFIG.services.uber
  
  const isDebug = process.env.NODE_ENV === 'development'
  
  if (isDebug) {
    console.debug('🚖 Enhanced Fare Calculation:', {
      service,
      distance: `${distanceKm.toFixed(2)}km`,
      duration: `${durationMin.toFixed(1)}min`,
      surge: `${surgeMultiplier.toFixed(2)}x`
    })
  }

  // 1. Base calculations
  const distanceMiles = kmToMiles(distanceKm)
  const baseFare = config.base
  const distanceFee = distanceMiles * config.perMile
  const timeFee = durationMin * config.perMin
  const bookingFee = config.booking
  const safetyFee = config.safetyFee || 0

  // 2. Location-based fees
  let airportFees = 0
  let locationSurcharge = 0
  let longRideFee = 0

      if (pickupCoords && destCoords) {
    // Airport fees with special SJC handling
    const pickupAirport = isAirportLocation(pickupCoords)
    const destAirport = isAirportLocation(destCoords)
    
    if (pickupAirport) {
      if (pickupAirport.code === 'SJC' && (config as any).sjcFee) {
        airportFees += (config as any).sjcFee.pickup
      } else {
        airportFees += config.airportPickupFee || 0
      }
    }
    
    if (destAirport) {
      if (destAirport.code === 'SJC' && (config as any).sjcFee) {
        airportFees += (config as any).sjcFee.dropoff
      } else {
        airportFees += config.airportDropoffFee || 0
      }
    }

    // Downtown surcharge
    const isDowntown = (coords: Coordinates): boolean => {
      const [lon, lat] = coords
      if (lat >= 37.785 && lat <= 37.805 && lon >= -122.415 && lon <= -122.395) return true
      if (lat >= 37.325 && lat <= 37.345 && lon >= -121.895 && lon <= -121.875) return true
      return false
    }

    if (isDowntown(pickupCoords) || isDowntown(destCoords)) {
      const hour = (timestamp || new Date()).getHours()
      const isBusinessHours = hour >= 9 && hour <= 17
      const isNightlife = hour >= 20 || hour <= 2
      
      if (isBusinessHours) {
        locationSurcharge = config.cbdSurcharge * 0.5
      } else if (isNightlife) {
        locationSurcharge = config.cbdSurcharge * 1.2
      } else {
        locationSurcharge = config.cbdSurcharge
      }
    }
  }

  // Long ride fee
  if (distanceMiles >= config.longRideFee.threshold) {
    longRideFee = config.longRideFee.fee
  }

  // 3. Calculate total
  const subtotal = baseFare + distanceFee + timeFee + bookingFee + safetyFee + airportFees + locationSurcharge + longRideFee
  const fareWithSurge = subtotal * surgeMultiplier
  const finalFare = Math.max(fareWithSurge, config.minFare)

  if (isDebug) {
    console.debug('💰 Enhanced Fare Breakdown:', {
      base: `$${baseFare.toFixed(2)}`,
      distance: `$${distanceFee.toFixed(2)} (${distanceMiles.toFixed(1)}mi)`,
      time: `$${timeFee.toFixed(2)} (${durationMin.toFixed(1)}min)`,
      booking: `$${bookingFee.toFixed(2)}`,
      safety: `$${safetyFee.toFixed(2)}`,
      airport: `$${airportFees.toFixed(2)}`,
      location: `$${locationSurcharge.toFixed(2)}`,
      longRide: `$${longRideFee.toFixed(2)}`,
      subtotal: `$${subtotal.toFixed(2)}`,
      surge: `${surgeMultiplier.toFixed(2)}x = $${(subtotal * (surgeMultiplier - 1)).toFixed(2)}`,
      final: `$${finalFare.toFixed(2)}`,
      minFareApplied: finalFare === config.minFare
    })
  }

  return finalFare
}

/**
 * Enhanced fare calculation with coordinates (new interface)
 */
export function calculateEnhancedFare(
  service: ServiceType,
  pickupCoords: Coordinates,
  destCoords: Coordinates,
  distanceKm: number,
  durationMin: number,
  timestamp?: Date
): { price: string; surgeReason: string; confidence: number } {
  // Get enhanced surge multiplier
  const { multiplier: surgeMultiplier, surgeReason } = getTimeBasedMultiplier(
    pickupCoords,
    destCoords,
    timestamp
  )

  // Calculate fare with all enhancements
  const finalFare = calculateFare(
    service,
    distanceKm,
    durationMin,
    surgeMultiplier,
    pickupCoords,
    destCoords,
    timestamp
  )

  // Calculate confidence (simplified)
  let confidence = 0.9
  if (surgeMultiplier > 2.0) confidence -= 0.15
  else if (surgeMultiplier > 1.5) confidence -= 0.1
  
  if (distanceKm > 50) confidence -= 0.15
  else if (distanceKm > 25) confidence -= 0.1

  const hour = (timestamp || new Date()).getHours()
  if (hour >= 1 && hour <= 5) confidence -= 0.1

  confidence = Math.max(confidence, 0.5)

  return {
    price: `$${finalFare.toFixed(2)}`,
    surgeReason,
    confidence
  }
}

// Legacy compatibility - keep existing functions working
export function getBestTimeRecommendations(): string[] {
  const now = new Date()
  const hour = now.getHours()

  if (hour >= 14 && hour <= 16) {
    return [
      "Great timing! You're booking during off-peak hours",
      'Best prices are typically 2-4 PM (avoid rush hours for savings)',
    ]
  } else if (hour >= 7 && hour <= 9) {
    return [
      'Rush hour pricing in effect. Expect 20-40% increase over standard rates',
      'Best prices: 2-4 PM (avoid peak hours for savings)',
    ]
  } else if (hour >= 17 && hour <= 19) {
    return [
      'Evening rush pricing. Consider waiting until after 8 PM for better rates',
      'Best prices: 2-4 PM (avoid peak hours for savings)',
    ]
  } else if (hour >= 20 || hour <= 5) {
    return [
      'Late night premium in effect (up to 30% increase)',
      'Best prices: 2-4 PM (avoid peak hours for savings)',
    ]
  } else {
    return [
      'Best prices: 2-4 PM (avoid peak hours for savings)',
      'Avoid rush hours: 7-9 AM and 5-7 PM (up to 40% increase)',
    ]
  }
}

export function hasAirportSurcharge(pickup: Coordinates, dest: Coordinates): boolean {
  return isAirportLocation(pickup) !== null || isAirportLocation(dest) !== null
}
