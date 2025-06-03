"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Navigation2, Loader2 } from "lucide-react"
import RideComparisonResults from "./ride-comparison-results"
import RouteMap from './RouteMap'

// Common places cache for faster autocomplete
const COMMON_PLACES = {
  'santa clara university': {
    display_name: 'Santa Clara University, Santa Clara, CA, USA',
    name: 'Santa Clara University',
    lat: '37.3496',
    lon: '-121.9390'
  },
  'san jose airport': {
    display_name: 'San Jose International Airport (SJC), San Jose, CA, USA',
    name: 'San Jose Airport (SJC)',
    lat: '37.3639',
    lon: '-121.9289'
  },
  'sjc': {
    display_name: 'San Jose International Airport (SJC), San Jose, CA, USA',
    name: 'San Jose Airport (SJC)',
    lat: '37.3639',
    lon: '-121.9289'
  },
  'sfo': {
    display_name: 'San Francisco International Airport (SFO), San Francisco, CA, USA',
    name: 'San Francisco Airport (SFO)',
    lat: '37.6213',
    lon: '-122.3790'
  },
  'san francisco airport': {
    display_name: 'San Francisco International Airport (SFO), San Francisco, CA, USA',
    name: 'San Francisco Airport (SFO)',
    lat: '37.6213',
    lon: '-122.3790'
  },
  'oakland airport': {
    display_name: 'Oakland International Airport (OAK), Oakland, CA, USA',
    name: 'Oakland Airport (OAK)',
    lat: '37.7126',
    lon: '-122.2197'
  },
  'oak': {
    display_name: 'Oakland International Airport (OAK), Oakland, CA, USA',
    name: 'Oakland Airport (OAK)',
    lat: '37.7126',
    lon: '-122.2197'
  },
  'stanford university': {
    display_name: 'Stanford University, Stanford, CA, USA',
    name: 'Stanford University',
    lat: '37.4275',
    lon: '-122.1697'
  },
  'cupertino': {
    display_name: 'Cupertino, CA, USA',
    name: 'Cupertino',
    lat: '37.3230',
    lon: '-122.0322'
  },
  'apple park': {
    display_name: 'Apple Park, Cupertino, CA, USA',
    name: 'Apple Park',
    lat: '37.3349',
    lon: '-122.0090'
  },
  'google': {
    display_name: 'Googleplex, Mountain View, CA, USA',
    name: 'Google Headquarters',
    lat: '37.4220',
    lon: '-122.0841'
  },
  'mountain view': {
    display_name: 'Mountain View, CA, USA',
    name: 'Mountain View',
    lat: '37.3861',
    lon: '-122.0839'
  },
  'palo alto': {
    display_name: 'Palo Alto, CA, USA',
    name: 'Palo Alto',
    lat: '37.4419',
    lon: '-122.1430'
  },
  'san jose': {
    display_name: 'San Jose, CA, USA',
    name: 'San Jose',
    lat: '37.3382',
    lon: '-121.8863'
  },
  'santa clara': {
    display_name: 'Santa Clara, CA, USA',
    name: 'Santa Clara',
    lat: '37.3541',
    lon: '-121.9552'
  },
  'sunnyvale': {
    display_name: 'Sunnyvale, CA, USA',
    name: 'Sunnyvale',
    lat: '37.3688',
    lon: '-122.0363'
  },
  'fremont': {
    display_name: 'Fremont, CA, USA',
    name: 'Fremont',
    lat: '37.5485',
    lon: '-121.9886'
  },
  'san francisco': {
    display_name: 'San Francisco, CA, USA',
    name: 'San Francisco',
    lat: '37.7749',
    lon: '-122.4194'
  },
  'downtown san jose': {
    display_name: 'Downtown San Jose, San Jose, CA, USA',
    name: 'Downtown San Jose',
    lat: '37.3382',
    lon: '-121.8863'
  }
}

// Cache for API results
const searchCache = new Map()

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const destDebounceTimeoutRef = useRef<NodeJS.Timeout>()

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

  // Enhanced search function that checks common places first
  const searchPlaces = async (query: string): Promise<any[]> => {
    const normalizedQuery = query.toLowerCase().trim()
    
    // Check cache first
    if (searchCache.has(normalizedQuery)) {
      return searchCache.get(normalizedQuery)
    }
    
    // Check common places first
    const commonMatches = Object.entries(COMMON_PLACES)
      .filter(([key, place]) => 
        key.includes(normalizedQuery) || 
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.display_name.toLowerCase().includes(normalizedQuery)
      )
      .map(([key, place]) => ({
        place_id: key,
        display_name: place.display_name,
        name: place.name,
        lat: place.lat,
        lon: place.lon
      }))

    // If we have good common matches, return them first
    if (commonMatches.length > 0 && normalizedQuery.length >= 3) {
      try {
        // Still fetch from API but combine results
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' California')}&format=json&limit=3&countrycodes=us&addressdetails=1&extratags=1`,
          {
            headers: {
              'User-Agent': 'RideCompareApp/1.0'
            }
          }
        )
        const apiData = await response.json()
        
        // Combine common places with API results, prioritizing common places
        const combinedResults = [...commonMatches, ...apiData.slice(0, 3)]
        const uniqueResults = combinedResults.filter((item, index, self) => 
          index === self.findIndex(t => 
            t.display_name === item.display_name || 
            (t.name && item.name && t.name === item.name) ||
            (t.lat && item.lat && Math.abs(parseFloat(t.lat) - parseFloat(item.lat)) < 0.001 &&
             t.lon && item.lon && Math.abs(parseFloat(t.lon) - parseFloat(item.lon)) < 0.001)
          )
        ).slice(0, 5)
        
        searchCache.set(normalizedQuery, uniqueResults)
        return uniqueResults
      } catch (error) {
        console.error("API error, using common places:", error)
        searchCache.set(normalizedQuery, commonMatches)
        return commonMatches
      }
    }

    // Fallback to API only
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' California')}&format=json&limit=5&countrycodes=us&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'RideCompareApp/1.0'
          }
        }
      )
      const data = await response.json()
      searchCache.set(normalizedQuery, data)
      return data
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      return []
    }
  }

  // fetch function for pickup
  const debouncedFetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setShowPickupSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const data = await searchPlaces(query)
      setSuggestions(data)
      setShowPickupSuggestions(data.length > 0)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
      setShowPickupSuggestions(false)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  // fetch function for destination
  const debouncedFetchDestinationSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDestinationSuggestions([])
      setShowDestinationSuggestions(false)
      return
    }

    setIsLoadingDestSuggestions(true)
    try {
      const data = await searchPlaces(query)
      setDestinationSuggestions(data)
      setShowDestinationSuggestions(data.length > 0)
    } catch (error) {
      console.error("Error fetching destination suggestions:", error)
      setDestinationSuggestions([])
      setShowDestinationSuggestions(false)
    } finally {
      setIsLoadingDestSuggestions(false)
    }
  }, [])

  const handlePickupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPickup(value)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      debouncedFetchSuggestions(value)
    }, 300) // 300ms delay
  }

  const handleSuggestionClick = (suggestion: any) => {
    setPickup(suggestion.display_name)
    setSuggestions([])
    setShowPickupSuggestions(false)
  }

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestination(value)
    
    // Clear existing timeout
    if (destDebounceTimeoutRef.current) {
      clearTimeout(destDebounceTimeoutRef.current)
    }
    
    // Set new timeout for  search
    destDebounceTimeoutRef.current = setTimeout(() => {
      debouncedFetchDestinationSuggestions(value)
    }, 300) // 300ms delay
  }

  const handleDestinationSuggestionClick = (suggestion: any) => {
    setDestination(suggestion.display_name)
    setDestinationSuggestions([])
    setShowDestinationSuggestions(false)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (destDebounceTimeoutRef.current) {
        clearTimeout(destDebounceTimeoutRef.current)
      }
    }
  }, [])

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
      // to simulated data for demo purposes
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
              placeholder="Enter pickup location (e.g., Santa Clara University, Cupertino)"
              value={pickup}
              onChange={handlePickupChange}
              onFocus={() => {
                if (pickup.length >= 2) {
                  if (suggestions.length > 0) {
                    setShowPickupSuggestions(true)
                  } else {
                    // Trigger search immediately on focus if there's content
                    debouncedFetchSuggestions(pickup)
                  }
                }
              }}
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
              placeholder="Enter destination (e.g., San Jose Airport, SFO)"
              value={destination}
              onChange={handleDestinationChange}
              onFocus={() => {
                if (destination.length >= 2) {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true)
                  } else {
                    // Trigger search immediately on focus if there's content
                    debouncedFetchDestinationSuggestions(destination)
                  }
                }
              }}
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
