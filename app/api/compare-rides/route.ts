import { type NextRequest, NextResponse } from 'next/server'

// POST handler
export async function POST(request: NextRequest) {
  try {
    const { pickup, destination } = await request.json()

    if (!pickup || !destination) {
      return NextResponse.json({ error: 'Pickup and destination are required' }, { status: 400 })
    }

    // Convert addresses to coordinates
    const pickupCoords = await getCoordinatesFromAddress(pickup)
    const destinationCoords = await getCoordinatesFromAddress(destination)

    if (!pickupCoords || !destinationCoords) {
      return NextResponse.json({ error: 'Could not geocode addresses' }, { status: 400 })
    }

    // Get comparisons
    const comparisons = await getRideComparisons(pickupCoords, destinationCoords)

    // Generate recommendation
    const insights = generateAlgorithmicRecommendation(comparisons)

    return NextResponse.json({
      comparisons,
      insights,
      pickupCoords,
      destinationCoords,
      surgeInfo: comparisons.surgeInfo,
      timeRecommendations: comparisons.timeRecommendations,
    })
  } catch (error) {
    console.error('Error comparing rides:', error)
    return NextResponse.json({ error: 'Failed to compare rides' }, { status: 500 })
  }
}

// Geocode using OpenStreetMap Nominatim
async function getCoordinatesFromAddress(address: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'RideCompareApp/1.0 (bjwmyjackwu@gmail.com)',
    },
  })
  const data = await res.json()
  console.log('Nominatim response for', address, ':', data)
  if (!data || data.length === 0) return null
  const { lon, lat } = data[0]
  return [parseFloat(lon), parseFloat(lat)]
}

// Calculate distance and duration using OSRM API
async function getDistanceAndDuration(
  pickupCoords: [number, number],
  destCoords: [number, number]
): Promise<{ distanceKm: number; durationMin: number }> {
  const [pickupLon, pickupLat] = pickupCoords
  const [destLon, destLat] = destCoords

  const url = `http://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${destLon},${destLat}?overview=false`

  const res = await fetch(url)
  const data = await res.json()

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Failed to fetch route from OSRM')
  }

  const durationMin = data.routes[0].duration / 60 // seconds to minutes
  const distanceKm = data.routes[0].distance / 1000 // meters to kilometers

  return { distanceKm, durationMin }
}

// Calculate realistic surge multiplier (more conservative, route-dependent)
function getTimeBasedMultiplier(
  pickupCoords: [number, number],
  destCoords: [number, number]
): { multiplier: number; surgeReason: string } {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = day === 0 || day === 6

  // Check if this is a high-demand route (airports, major venues)
  const isAirportRoute =
    (Math.abs(pickupCoords[0] - -122.3839894) < 0.05 &&
      Math.abs(pickupCoords[1] - 37.622452) < 0.05) ||
    (Math.abs(destCoords[0] - -122.3839894) < 0.05 && Math.abs(destCoords[1] - 37.622452) < 0.05)

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

// Generate best time recommendations (concise 2-tip format)
function getBestTimeRecommendations(): string[] {
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

// Realistic Bay Area rideshare rates (calibrated to match real UberX pricing)
const UBER = {
  base: 1.25, // Reduced base to match real pricing
  perMile: 1.08, // Reduced per-mile rate
  perMin: 0.28, // Reduced per-minute rate
  booking: 0.85, // Reduced booking fee
  airportSurcharge: 4.25,
  minFare: 8.5, // Slightly reduced minimum
}

function kmToMiles(km: number) {
  return km * 0.621371
}

// Generate simulated comparison data
async function getRideComparisons(pickupCoords: [number, number], destCoords: [number, number]) {
  const { distanceKm, durationMin } = await getDistanceAndDuration(pickupCoords, destCoords)
  const { multiplier, surgeReason } = getTimeBasedMultiplier(pickupCoords, destCoords)
  const distanceMiles = kmToMiles(distanceKm)

  console.log(
    `Distance: ${distanceKm.toFixed(2)} km, Duration: ${durationMin.toFixed(1)} min, Surge: ${multiplier}x (${surgeReason})`
  )

  // Realistic competitive rates (slightly more competitive than Uber)
  const LYFT = {
    base: 1.15, // Lower base than Uber
    perMile: 1.05, // Slightly lower per-mile rate
    perMin: 0.26, // Lower per-minute rate
    booking: 0.75, // Lower booking fee
    airportSurcharge: 4.25,
    minFare: 8.0, // Lower minimum fare
  }
  const TAXI = {
    base: 3.5,
    perMile: 2.75, // Taxis are significantly more per mile
    perMin: 0.55,
    booking: 0.0,
    airportSurcharge: 0.0,
    minFare: 10.0,
  }

  // Airport fee logic
  const isAirport = (pickup: [number, number], dest: [number, number]) =>
    (Math.abs(pickup[0] - -122.3839894) < 0.05 && Math.abs(pickup[1] - 37.622452) < 0.05) ||
    (Math.abs(dest[0] - -122.3839894) < 0.05 && Math.abs(dest[1] - 37.622452) < 0.05)

  // Calculate base prices first
  let uberBasePriceRaw =
    UBER.base + UBER.perMile * distanceMiles + UBER.perMin * durationMin + UBER.booking
  if (isAirport(pickupCoords, destCoords)) uberBasePriceRaw += UBER.airportSurcharge
  if (uberBasePriceRaw < UBER.minFare) uberBasePriceRaw = UBER.minFare

  let lyftBasePriceRaw =
    LYFT.base + LYFT.perMile * distanceMiles + LYFT.perMin * durationMin + LYFT.booking
  if (isAirport(pickupCoords, destCoords)) lyftBasePriceRaw += LYFT.airportSurcharge
  if (lyftBasePriceRaw < LYFT.minFare) lyftBasePriceRaw = LYFT.minFare

  // Taxi
  let taxiBasePriceRaw
  if (isSantaClaraToSFO(pickupCoords, destCoords)) {
    taxiBasePriceRaw = 89 + Math.random() * (99 - 89)
  } else if (isAirport(pickupCoords, destCoords)) {
    taxiBasePriceRaw = Math.max(
      TAXI.base + TAXI.perMile * distanceMiles + TAXI.perMin * durationMin + TAXI.booking,
      60
    )
  } else {
    taxiBasePriceRaw =
      TAXI.base + TAXI.perMile * distanceMiles + TAXI.perMin * durationMin + TAXI.booking
    if (taxiBasePriceRaw < TAXI.minFare) taxiBasePriceRaw = TAXI.minFare
  }

  // Apply time-based surge pricing
  const uberPriceRaw = uberBasePriceRaw * multiplier
  const lyftPriceRaw = lyftBasePriceRaw * multiplier
  const taxiPriceRaw = taxiBasePriceRaw * Math.min(multiplier, 1.2)
  const baseWaitTime = 2 + Math.floor(Math.random() * 5)
  const surgeWaitMultiplier = multiplier > 1.5 ? 1.5 : 1.0

  return {
    uber: {
      price: `$${uberPriceRaw.toFixed(2)}`,
      waitTime: `${Math.round(baseWaitTime * surgeWaitMultiplier)} min`,
      driversNearby: Math.floor(3 + Math.random() * 5),
      service: 'UberX',
      surgeMultiplier: multiplier > 1.1 ? `${multiplier.toFixed(1)}x` : null,
    },
    lyft: {
      price: `$${lyftPriceRaw.toFixed(2)}`,
      waitTime: `${Math.round((baseWaitTime + 1) * surgeWaitMultiplier)} min`,
      driversNearby: Math.floor(2 + Math.random() * 4),
      service: 'Lyft Standard',
      surgeMultiplier: multiplier * 0.95 > 1.1 ? `${(multiplier * 0.95).toFixed(1)}x` : null,
    },
    taxi: {
      price: `$${taxiPriceRaw.toFixed(2)}`,
      waitTime: `${Math.round((baseWaitTime + 3) * Math.min(surgeWaitMultiplier, 1.2))} min`,
      driversNearby: Math.floor(1 + Math.random() * 3),
      service: 'Yellow Cab',
      surgeMultiplier: multiplier > 1.1 ? `${(multiplier * 0.95).toFixed(1)}x` : null, // Keep visual surge slightly different
    },
    surgeInfo: {
      isActive: multiplier > 1.1,
      reason: surgeReason,
      multiplier: multiplier,
    },
    timeRecommendations: getBestTimeRecommendations(),
  }
}

// Generate insights based on score
function generateAlgorithmicRecommendation(comparisons: {
  uber: { price: string; waitTime: string }
  lyft: { price: string; waitTime: string }
  taxi: { price: string; waitTime: string }
}) {
  const uberPrice = parseFloat(comparisons.uber.price.replace('$', ''))
  const lyftPrice = parseFloat(comparisons.lyft.price.replace('$', ''))
  const taxiPrice = parseFloat(comparisons.taxi.price.replace('$', ''))

  const uberWait = parseInt(comparisons.uber.waitTime.replace(' min', ''))
  const lyftWait = parseInt(comparisons.lyft.waitTime.replace(' min', ''))
  const taxiWait = parseInt(comparisons.taxi.waitTime.replace(' min', ''))

  const uberScore = uberPrice * 0.7 + uberWait * 0.3
  const lyftScore = lyftPrice * 0.7 + lyftWait * 0.3
  const taxiScore = taxiPrice * 0.7 + taxiWait * 0.3

  const scores = [
    { service: 'Uber', score: uberScore, price: uberPrice, wait: uberWait },
    { service: 'Lyft', score: lyftScore, price: lyftPrice, wait: lyftWait },
    { service: 'Taxi', score: taxiScore, price: taxiPrice, wait: taxiWait },
  ]

  const bestOption = scores.reduce((prev, curr) => (prev.score < curr.score ? prev : curr))
  const cheapestOption = scores.reduce((prev, curr) => (prev.price < curr.price ? prev : curr))
  const fastestOption = scores.reduce((prev, curr) => (prev.wait < curr.wait ? prev : curr))

  let recommendation = `Based on a combination of price and wait time, ${bestOption.service} appears to be your best overall option for this trip.`

  if (
    bestOption.service !== cheapestOption.service &&
    bestOption.service !== fastestOption.service
  ) {
    recommendation += ` If you're looking to save money, ${cheapestOption.service} is the cheapest option. For the shortest wait time, choose ${fastestOption.service}.`
  } else if (bestOption.service !== cheapestOption.service) {
    recommendation += ` However, if you're looking to save money, ${cheapestOption.service} is the cheapest option.`
  } else if (bestOption.service !== fastestOption.service) {
    recommendation += ` However, for the shortest wait time, choose ${fastestOption.service}.`
  }

  return recommendation
}

// Add this helper function
function isSantaClaraToSFO(pickup: [number, number], dest: [number, number]) {
  const santaClaraLat = 37.3541
  const santaClaraLon = -121.9552
  // SFO coordinates
  const sfoLat = 37.622452
  const sfoLon = -122.3839894
  // If either end is Santa Clara and the other is SFO
  const isSantaClara = (lat: number, lon: number) =>
    Math.abs(lat - santaClaraLat) < 0.05 && Math.abs(lon - santaClaraLon) < 0.05
  const isSFO = (lat: number, lon: number) =>
    Math.abs(lat - sfoLat) < 0.05 && Math.abs(lon - sfoLon) < 0.05
  return (
    (isSantaClara(pickup[1], pickup[0]) && isSFO(dest[1], dest[0])) ||
    (isSantaClara(dest[1], dest[0]) && isSFO(pickup[1], pickup[0]))
  )
}
