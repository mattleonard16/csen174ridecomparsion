import { type NextRequest, NextResponse } from "next/server"

// This is a server-side route handler that will process ride comparison requests
export async function POST(request: NextRequest) {
  try {
    const { pickup, destination } = await request.json()

    if (!pickup || !destination) {
      return NextResponse.json({ error: "Pickup and destination are required" }, { status: 400 })
    }

    // Get ride comparison data (simulated for now)
    const comparisons = await getRideComparisons(pickup, destination)

    // Generate insights using our algorithm instead of AI
    const insights = generateAlgorithmicRecommendation(comparisons)

    return NextResponse.json({
      comparisons,
      insights,
    })
  } catch (error) {
    console.error("Error comparing rides:", error)
    return NextResponse.json({ error: "Failed to compare rides" }, { status: 500 })
  }
}

// Simulate fetching ride data
async function getRideComparisons(pickup: string, destination: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate some random variations for realistic comparison
  const basePrice = 15 + Math.random() * 10
  const baseWaitTime = 2 + Math.floor(Math.random() * 5)

  return {
    uber: {
      price: `$${(basePrice * 1.05).toFixed(2)}`,
      waitTime: `${baseWaitTime} min`,
      driversNearby: Math.floor(3 + Math.random() * 5),
      service: "UberX",
    },
    lyft: {
      price: `$${(basePrice * 0.95).toFixed(2)}`,
      waitTime: `${baseWaitTime + 1} min`,
      driversNearby: Math.floor(2 + Math.random() * 4),
      service: "Lyft Standard",
    },
    taxi: {
      price: `$${(basePrice * 1.2).toFixed(2)}`,
      waitTime: `${baseWaitTime + 3} min`,
      driversNearby: Math.floor(1 + Math.random() * 3),
      service: "Yellow Cab",
    },
  }
}

// Algorithmic recommendation function (no AI)
function generateAlgorithmicRecommendation(comparisons: any) {
  // Parse prices (remove $ sign)
  const uberPrice = Number.parseFloat(comparisons.uber.price.replace("$", ""))
  const lyftPrice = Number.parseFloat(comparisons.lyft.price.replace("$", ""))
  const taxiPrice = Number.parseFloat(comparisons.taxi.price.replace("$", ""))

  // Parse wait times (remove " min")
  const uberWait = Number.parseInt(comparisons.uber.waitTime.replace(" min", ""))
  const lyftWait = Number.parseInt(comparisons.lyft.waitTime.replace(" min", ""))
  const taxiWait = Number.parseInt(comparisons.taxi.waitTime.replace(" min", ""))

  // Simple scoring system (lower is better)
  // Weight price at 70% and wait time at 30%
  const uberScore = uberPrice * 0.7 + uberWait * 0.3
  const lyftScore = lyftPrice * 0.7 + lyftWait * 0.3
  const taxiScore = taxiPrice * 0.7 + taxiWait * 0.3

  // Find the best option
  const scores = [
    { service: "Uber", score: uberScore, price: uberPrice, wait: uberWait },
    { service: "Lyft", score: lyftScore, price: lyftPrice, wait: lyftWait },
    { service: "Taxi", score: taxiScore, price: taxiPrice, wait: taxiWait },
  ]

  const bestOption = scores.reduce((prev, current) => (prev.score < current.score ? prev : current))

  // Find the cheapest option
  const cheapestOption = scores.reduce((prev, current) => (prev.price < current.price ? prev : current))

  // Find the fastest option
  const fastestOption = scores.reduce((prev, current) => (prev.wait < current.wait ? prev : current))

  // Generate recommendation
  let recommendation = `Based on a combination of price and wait time, ${bestOption.service} appears to be your best overall option for this trip.`

  // Add additional insights if the best overall isn't the cheapest or fastest
  if (bestOption.service !== cheapestOption.service && bestOption.service !== fastestOption.service) {
    recommendation += ` If you're looking to save money, ${cheapestOption.service} is the cheapest option. For the shortest wait time, choose ${fastestOption.service}.`
  } else if (bestOption.service !== cheapestOption.service) {
    recommendation += ` However, if you're looking to save money, ${cheapestOption.service} is the cheapest option.`
  } else if (bestOption.service !== fastestOption.service) {
    recommendation += ` However, for the shortest wait time, choose ${fastestOption.service}.`
  }

  return recommendation
}
