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

    return NextResponse.json({
      comparisons,
      insights,
      pickupCoords,
      destinationCoords
    })
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

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("Failed to fetch route from OSRM")
  }

  const durationMin = data.routes[0].duration / 60 // seconds to minutes
  const distanceKm = data.routes[0].distance / 1000 // meters to kilometers

  return { distanceKm, durationMin }
}

// Example rates for UberX in the Bay Area (adjust as needed)
const UBER = {
  base: 2.50,
  perMile: 1.80,
  perMin: 0.40,
  booking: 2.55,
  airportSurcharge: 4.00,
  minFare: 10.00,
};

function kmToMiles(km: number) {
  return km * 0.621371;
}

// Generate simulated comparison data
async function getRideComparisons(pickupCoords: [number, number], destCoords: [number, number]) {
  const { distanceKm, durationMin } = await getDistanceAndDuration(pickupCoords, destCoords);
  const distanceMiles = kmToMiles(distanceKm);

  // Updated rates
  const LYFT = { base: 2.00, perMile: 1.70, perMin: 0.35, booking: 2.50, minFare: 10.00 };
  const TAXI = { base: 3.50, perMile: 3.00, perMin: 0.50, booking: 0.00, minFare: 10.00 };

  // Airport fee logic
  const isAirport = (pickup: [number, number], dest: [number, number]) =>
    Math.abs(pickup[0] - -122.3839894) < 0.05 && Math.abs(pickup[1] - 37.6224520) < 0.05 ||
    Math.abs(dest[0] - -122.3839894) < 0.05 && Math.abs(dest[1] - 37.6224520) < 0.05;
  const airportFee = isAirport(pickupCoords, destCoords) ? UBER.airportSurcharge : 0;

  // Uber
  let uberPriceRaw = UBER.base + UBER.perMile * distanceMiles + UBER.perMin * durationMin + UBER.booking;
  if (isAirport(pickupCoords, destCoords)) uberPriceRaw += UBER.airportSurcharge;
  if (uberPriceRaw < UBER.minFare) uberPriceRaw = UBER.minFare;

  // Lyft
  let lyftPriceRaw = LYFT.base + LYFT.perMile * distanceMiles + LYFT.perMin * durationMin + LYFT.booking;
  if (isAirport(pickupCoords, destCoords)) lyftPriceRaw += UBER.airportSurcharge;
  if (lyftPriceRaw < LYFT.minFare) lyftPriceRaw = LYFT.minFare;

  // Taxi: Use flat rate for Santa Clara <-> SFO, else metered with airport minimum
  let taxiPriceRaw;
  if (isSantaClaraToSFO(pickupCoords, destCoords)) {
    taxiPriceRaw = 89 + Math.random() * (99 - 89); // Bias toward higher end
  } else if (isAirport(pickupCoords, destCoords)) {
    taxiPriceRaw = Math.max(TAXI.base + TAXI.perMile * distanceMiles + TAXI.perMin * durationMin + TAXI.booking, 60);
  } else {
    taxiPriceRaw = TAXI.base + TAXI.perMile * distanceMiles + TAXI.perMin * durationMin + TAXI.booking;
    if (taxiPriceRaw < TAXI.minFare) taxiPriceRaw = TAXI.minFare;
  }

  const baseWaitTime = 2 + Math.floor(Math.random() * 5);

  return {
    uber: {
      price: `$${uberPriceRaw.toFixed(2)}`,
      waitTime: `${baseWaitTime} min`,
      driversNearby: Math.floor(3 + Math.random() * 5),
      service: "UberX",
    },
    lyft: {
      price: `$${lyftPriceRaw.toFixed(2)}`,
      waitTime: `${baseWaitTime + 1} min`,
      driversNearby: Math.floor(2 + Math.random() * 4),
      service: "Lyft Standard",
    },
    taxi: {
      price: `$${taxiPriceRaw.toFixed(2)}`,
      waitTime: `${baseWaitTime + 3} min`,
      driversNearby: Math.floor(1 + Math.random() * 3),
      service: "Yellow Cab",
    },
  };
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

// Add this helper function
function isSantaClaraToSFO(pickup: [number, number], dest: [number, number]) {
  const santaClaraLat = 37.3541;
  const santaClaraLon = -121.9552;
  // SFO coordinates
  const sfoLat = 37.6224520;
  const sfoLon = -122.3839894;
  // If either end is Santa Clara and the other is SFO
  const isSantaClara = (lat: number, lon: number) =>
    Math.abs(lat - santaClaraLat) < 0.05 && Math.abs(lon - santaClaraLon) < 0.05;
  const isSFO = (lat: number, lon: number) =>
    Math.abs(lat - sfoLat) < 0.05 && Math.abs(lon - sfoLon) < 0.05;
  return (isSantaClara(pickup[1], pickup[0]) && isSFO(dest[1], dest[0])) ||
         (isSantaClara(dest[1], dest[0]) && isSFO(pickup[1], pickup[0]));
}

function isAirportTrip(pickup: [number, number], dest: [number, number]) {
  // SFO, SJC, OAK coordinates
  const airports = [
    { lat: 37.6224520, lon: -122.3839894 }, // SFO
    { lat: 37.363947, lon: -121.928937 },   // SJC
    { lat: 37.7125689, lon: -122.2197428 }, // OAK
  ];
  const isNear = (lat: number, lon: number, airport: { lat: number, lon: number }) =>
    Math.abs(lat - airport.lat) < 0.05 && Math.abs(lon - airport.lon) < 0.05;
  return airports.some(a =>
    (isNear(pickup[1], pickup[0], a) || isNear(dest[1], dest[0], a))
  );
}
