"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Navigation2, Loader2 } from "lucide-react"
import RideComparisonResults from "./ride-comparison-results"
import RouteMap from './RouteMap'

export default function RideComparisonForm() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    uber: { price: string; waitTime: string; driversNearby: number; service: string };
    lyft: { price: string; waitTime: string; driversNearby: number; service: string };
    taxi: { price: string; waitTime: string; driversNearby: number; service: string };
  } | null>(null)
  const [insights, setInsights] = useState("")
  const [error, setError] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([])
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isLoadingDestSuggestions, setIsLoadingDestSuggestions] = useState(false)
  
  const pickupRef = useRef<HTMLDivElement>(null)
  const destinationRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false)
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowPickupSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us`
      )
      const data = await response.json()
      setSuggestions(data)
      setShowPickupSuggestions(data.length > 0)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
      setShowPickupSuggestions(false)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handlePickupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPickup(value)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (suggestion: any) => {
    setPickup(suggestion.display_name)
    setSuggestions([])
    setShowPickupSuggestions(false)
  }

  const fetchDestinationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setDestinationSuggestions([])
      setShowDestinationSuggestions(false)
      return
    }

    setIsLoadingDestSuggestions(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us`
      )
      const data = await response.json()
      setDestinationSuggestions(data)
      setShowDestinationSuggestions(data.length > 0)
    } catch (error) {
      console.error("Error fetching destination suggestions:", error)
      setDestinationSuggestions([])
      setShowDestinationSuggestions(false)
    } finally {
      setIsLoadingDestSuggestions(false)
    }
  }

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestination(value)
    fetchDestinationSuggestions(value)
  }

  const handleDestinationSuggestionClick = (suggestion: any) => {
    setDestination(suggestion.display_name)
    setDestinationSuggestions([])
    setShowDestinationSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setInsights("")
    setError("")
    // Clear coordinates when starting a new search
    setPickupCoords(null)
    setDestinationCoords(null)

    try {
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
        if (data.error && data.error.includes("geocode")) {
          setError("Please enter a more specific or valid address for both pickup and destination.")
        } else if (data.error && data.error.includes("required")) {
          setError("Both pickup and destination addresses are required.")
        } else {
          setError("Failed to fetch ride comparisons. Please try again.")
        }
        // Don't set coordinates on error - they should remain null
        return
      }

      setResults(data.comparisons)
      setInsights(data.insights)
      setPickupCoords(data.pickupCoords)
      setDestinationCoords(data.destinationCoords)
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
      // Don't set coordinates for simulated data
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative" ref={pickupRef}>
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
              onChange={handlePickupChange}
              onFocus={() => pickup.length >= 3 && suggestions.length > 0 && setShowPickupSuggestions(true)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            {/* Pickup Suggestions Dropdown */}
            {showPickupSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading suggestions...
                  </div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id || index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{suggestion.name || suggestion.display_name.split(',')[0]}</div>
                      <div className="text-xs text-gray-500 truncate">{suggestion.display_name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 relative" ref={destinationRef}>
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
              onChange={handleDestinationChange}
              onFocus={() => destination.length >= 3 && destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            {/* Destination Suggestions Dropdown */}
            {showDestinationSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoadingDestSuggestions ? (
                  <div className="p-3 text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading suggestions...
                  </div>
                ) : (
                  destinationSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id || index}
                      onClick={() => handleDestinationSuggestionClick(suggestion)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{suggestion.name || suggestion.display_name.split(',')[0]}</div>
                      <div className="text-xs text-gray-500 truncate">{suggestion.display_name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
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

      {pickupCoords && destinationCoords && (
        <RouteMap 
          key={`${pickupCoords[0]}-${pickupCoords[1]}-${destinationCoords[0]}-${destinationCoords[1]}`}
          pickup={pickupCoords} 
          destination={destinationCoords} 
        />
      )}

      {results && <RideComparisonResults results={results} insights={insights} />}
    </div>
  )
}
