"use client"

import { useState } from "react"
import { MapPin, Navigation2, Loader2 } from "lucide-react"
import RideComparisonResults from "./ride-comparison-results"

export default function RideComparisonForm() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [insights, setInsights] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setInsights("")
    setError("")

    try {
      // Call the API route
      const response = await fetch("/api/compare-rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pickup, destination }),
      }).catch((error) => {
        console.error("Fetch error:", error)
        throw new Error("Network error")
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for geocoding error
        if (data.error && data.error.includes("geocode")) {
          setError("Please enter a more specific or valid address for both pickup and destination.")
        } else if (data.error && data.error.includes("required")) {
          setError("Both pickup and destination addresses are required.")
        } else {
          setError("Failed to fetch ride comparisons. Please try again.")
        }
        return
      }

      setResults(data.comparisons)
      setInsights(data.insights)
    } catch (error) {
      console.error("Error:", error)
      // Fallback to simulated data for demo purposes
      const basePrice = 15 + Math.random() * 10
      const baseWaitTime = 2 + Math.floor(Math.random() * 5)

      const simulatedResults = {
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

      setResults(simulatedResults)
      setInsights("Based on price and wait time, Lyft appears to be your best option for this trip.")
      setError("Note: Using simulated data due to API connection issues.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-500 mr-2" />
              <label htmlFor="pickup" className="font-medium">
                Pickup Location
              </label>
            </div>
            <input
              id="pickup"
              placeholder="Enter pickup location (e.g., 500 El Camino Real, Santa Clara)"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Navigation2 className="h-5 w-5 text-gray-500 mr-2" />
              <label htmlFor="destination" className="font-medium">
                Destination
              </label>
            </div>
            <input
              id="destination"
              placeholder="Enter destination (e.g., San Francisco Airport)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding rides...
              </div>
            ) : (
              "Compare Rides"
            )}
          </button>
        </form>
      </div>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">{error}</div>}

      {results && <RideComparisonResults results={results} insights={insights} />}
    </div>
  )
}
