import { type NextRequest, NextResponse } from "next/server"

// POST handler
export async function POST(request: NextRequest) {
  try {
    const { pickup, destination } = await request.json()

    if (!pickup || !destination) {
      return NextResponse.json({ error: "Pickup and destination are required" }, { status: 400 })
    }

    // Convert addresses to coordinates
    const pickupCoords = await getCoordinatesFromAddress(pickup)
    const destinationCoords = await getCoordinatesFromAddress(destination)

    if (!pickupCoords || !destinationCoords) {
      return NextResponse.json({ error: "Could not geocode addresses" }, { status: 400 })
    }

    // Get comparisons
    const comparisons = await getRideComparisons(pickupCoords, destinationCoords)

    // Generate recommendation
    const insights = generateAlgorithmicRecommendation(comparisons)

    return NextResponse.json({ comparisons, insights })
  } catch (error) {
    console.error("Error comparing rides:", error)
    return NextResponse.json({ error: "Failed to compare rides" }, { status: 500 })
  }
}

// Geocode using OpenStreetMap Nominatim
async function getCoordinatesFromAddress(address: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "RideCompareApp/1.0 (bjwmyjackwu@gmail.com)"
    }
  })

  const data = await res.json()
  if (!data || data.length === 0) return null

  const { lon, lat } = data[0]
  return [parseFloat(lon), parseFloat(lat)]
}

// Calculate distance using OSRM API
async function getDistanceInKm(pickupCoords: [number, number], destCoords: [number, number]): Promise<number> {
  const [pickupLon, pickupLat] = pickupCoords
  const [destLon, destLat] = destCoords

  const url = `http://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${destLon},${destLat}?overview=false`

  const res = await fetch(url)
  const data = await res.json()

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("Failed to fetch route from OSRM")
  }

  return data.routes[0].distance / 1000 // meters to kilometers
}

// Generate simulated comparison data
async function getRideComparisons(pickupCoords: [number, number], destCoords: [number, number]) {
  const distanceKm = await getDistanceInKm(pickupCoords, destCoords)

  const baseFare = 2.5
  const perKmRate = 1.75
  const uberPriceRaw = baseFare + perKmRate * distanceKm

  const baseWaitTime = 2 + Math.floor(Math.random() * 5)

  return {
    uber: {
      price: `$${uberPriceRaw.toFixed(2)}`,
      waitTime: `${baseWaitTime} min`,
      driversNearby: Math.floor(3 + Math.random() * 5),
      service: "UberX",
    },
    lyft: {
      price: `$${(15 + Math.random() * 10 * 0.95).toFixed(2)}`,
      waitTime: `${baseWaitTime + 1} min`,
      driversNearby: Math.floor(2 + Math.random() * 4),
      service: "Lyft Standard",
    },
    taxi: {
      price: `$${(15 + Math.random() * 10 * 1.2).toFixed(2)}`,
      waitTime: `${baseWaitTime + 3} min`,
      driversNearby: Math.floor(1 + Math.random() * 3),
      service: "Yellow Cab",
    },
  }
}

// Generate insights based on score
function generateAlgorithmicRecommendation(comparisons: any) {
  const uberPrice = parseFloat(comparisons.uber.price.replace("$", ""))
  const lyftPrice = parseFloat(comparisons.lyft.price.replace("$", ""))
  const taxiPrice = parseFloat(comparisons.taxi.price.replace("$", ""))

  const uberWait = parseInt(comparisons.uber.waitTime.replace(" min", ""))
  const lyftWait = parseInt(comparisons.lyft.waitTime.replace(" min", ""))
  const taxiWait = parseInt(comparisons.taxi.waitTime.replace(" min", ""))

  const uberScore = uberPrice * 0.7 + uberWait * 0.3
  const lyftScore = lyftPrice * 0.7 + lyftWait * 0.3
  const taxiScore = taxiPrice * 0.7 + taxiWait * 0.3

  const scores = [
    { service: "Uber", score: uberScore, price: uberPrice, wait: uberWait },
    { service: "Lyft", score: lyftScore, price: lyftPrice, wait: lyftWait },
    { service: "Taxi", score: taxiScore, price: taxiPrice, wait: taxiWait },
  ]

  const bestOption = scores.reduce((prev, curr) => (prev.score < curr.score ? prev : curr))
  const cheapestOption = scores.reduce((prev, curr) => (prev.price < curr.price ? prev : curr))
  const fastestOption = scores.reduce((prev, curr) => (prev.wait < curr.wait ? prev : curr))

  let recommendation = `Based on a combination of price and wait time, ${bestOption.service} appears to be your best overall option for this trip.`

  if (bestOption.service !== cheapestOption.service && bestOption.service !== fastestOption.service) {
    recommendation += ` If you're looking to save money, ${cheapestOption.service} is the cheapest option. For the shortest wait time, choose ${fastestOption.service}.`
  } else if (bestOption.service !== cheapestOption.service) {
    recommendation += ` However, if you're looking to save money, ${cheapestOption.service} is the cheapest option.`
  } else if (bestOption.service !== fastestOption.service) {
    recommendation += ` However, for the shortest wait time, choose ${fastestOption.service}.`
  }

  return recommendation
}
