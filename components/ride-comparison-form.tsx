'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Navigation2, Loader2, Locate, Shield } from 'lucide-react'
import RideComparisonResults from './ride-comparison-results'
import RouteMap from './RouteMap'
import RouteHeader from './route-header'
import { useRecaptcha } from '@/lib/hooks/use-recaptcha'
import { RECAPTCHA_CONFIG } from '@/lib/recaptcha'
import { COMMON_PLACES } from '@/lib/constants'
import { AIRPORTS } from '@/lib/airports'
import AirportChip from '@/components/ui/airport-chip'

// Cache for API results
const searchCache = new Map()

export default function RideComparisonForm() {
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // reCAPTCHA integration
  const { executeRecaptcha, isLoaded: isRecaptchaLoaded, error: recaptchaError } = useRecaptcha()
  const [results, setResults] = useState<{
    uber: {
      price: string
      waitTime: string
      driversNearby: number
      service: string
      surgeMultiplier?: string
    }
    lyft: {
      price: string
      waitTime: string
      driversNearby: number
      service: string
      surgeMultiplier?: string
    }
    taxi: {
      price: string
      waitTime: string
      driversNearby: number
      service: string
      surgeMultiplier?: string
    }
  } | null>(null)
  const [insights, setInsights] = useState('')
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string; name?: string; place_id?: string }>
  >([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string; name?: string; place_id?: string }>
  >([])
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isLoadingDestSuggestions, setIsLoadingDestSuggestions] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [surgeInfo, setSurgeInfo] = useState<{
    isActive: boolean
    reason: string
    multiplier: number
  } | null>(null)
  const [timeRecommendations, setTimeRecommendations] = useState<string[]>([])
  // const [showPriceAlert, setShowPriceAlert] = useState(false)
  // const [priceAlertThreshold, setPriceAlertThreshold] = useState("")

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
  const searchPlaces = async (
    query: string
  ): Promise<
    Array<{ display_name: string; lat: string; lon: string; name?: string; place_id?: string }>
  > => {
    const normalizedQuery = query.toLowerCase().trim()

    // Check cache first
    if (searchCache.has(normalizedQuery)) {
      return searchCache.get(normalizedQuery)
    }

    // Check common places first
    const commonMatches = Object.entries(COMMON_PLACES)
      .filter(
        ([key, place]) =>
          key.includes(normalizedQuery) ||
          place.name.toLowerCase().includes(normalizedQuery) ||
          place.display_name.toLowerCase().includes(normalizedQuery)
      )
      .map(([key, place]) => ({
        place_id: key,
        display_name: place.display_name,
        name: place.name,
        lat: place.lat,
        lon: place.lon,
      }))

    // If we have good common matches, return them first
    if (commonMatches.length > 0 && normalizedQuery.length >= 3) {
      try {
        // Still fetch from API but combine results
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=us&addressdetails=1&extratags=1`,
          {
            headers: {
              'User-Agent': 'RideCompareApp/1.0',
            },
          }
        )
        const apiData = await response.json()

        // Combine common places with API results, prioritizing common places
        const combinedResults = [...commonMatches, ...apiData.slice(0, 3)]
        const uniqueResults = combinedResults
          .filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                t =>
                  t.display_name === item.display_name ||
                  (t.name && item.name && t.name === item.name) ||
                  (t.lat &&
                    item.lat &&
                    Math.abs(parseFloat(t.lat) - parseFloat(item.lat)) < 0.001 &&
                    t.lon &&
                    item.lon &&
                    Math.abs(parseFloat(t.lon) - parseFloat(item.lon)) < 0.001)
              )
          )
          .slice(0, 5)

        searchCache.set(normalizedQuery, uniqueResults)
        return uniqueResults
      } catch (error) {
        console.error('API error, using common places:', error)
        searchCache.set(normalizedQuery, commonMatches)
        return commonMatches
      }
    }

    // Fallback to API only
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'RideCompareApp/1.0',
          },
        }
      )
      const data = await response.json()
      searchCache.set(normalizedQuery, data)
      return data
    } catch (error) {
      console.error('Error fetching suggestions:', error)
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
      console.error('Error fetching suggestions:', error)
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
      console.error('Error fetching destination suggestions:', error)
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

    // Set new timeout for search
    debounceTimeoutRef.current = setTimeout(() => {
      debouncedFetchSuggestions(value)
    }, 300) // 300ms delay
  }

  const handleSuggestionClick = (suggestion: {
    display_name: string
    lat: string
    lon: string
    name?: string
    place_id?: string
  }) => {
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

  const handleDestinationSuggestionClick = (suggestion: {
    display_name: string
    lat: string
    lon: string
    name?: string
    place_id?: string
  }) => {
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
    setInsights('')
    setError('')
    // Clear coordinates when starting a new search
    setPickupCoords(null)
    setDestinationCoords(null)

    try {
      // Execute reCAPTCHA v3 (invisible, no user interaction required)
      let recaptchaToken = ''
      if (isRecaptchaLoaded) {
        try {
          recaptchaToken = await executeRecaptcha(RECAPTCHA_CONFIG.ACTIONS.RIDE_COMPARISON)
        } catch (recaptchaErr) {
          console.warn('reCAPTCHA failed, proceeding without token:', recaptchaErr)
          // Continue without reCAPTCHA token - the server will handle this gracefully
        }
      }

      const response = await fetch('/api/compare-rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          pickup, 
          destination,
          recaptchaToken // Include reCAPTCHA token if available
        }),
      }).catch(error => {
        console.error('Fetch error:', error)
        throw new Error('Network error')
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error && data.error.includes('geocode')) {
          setError('Please enter a more specific or valid address for both pickup and destination.')
        } else if (data.error && data.error.includes('required')) {
          setError('Both pickup and destination addresses are required.')
        } else {
          setError('Failed to fetch ride comparisons. Please try again.')
        }
        // Don't set coordinates on error - they should remain null
        return
      }

      setResults(data.comparisons)
      setInsights(data.insights)
      setPickupCoords(data.pickupCoords)
      setDestinationCoords(data.destinationCoords)
      setSurgeInfo(data.surgeInfo || null)
      setTimeRecommendations(data.timeRecommendations || [])
      setShowForm(false)
    } catch (error) {
      console.error('Error:', error)
      // to simulated data for demo purposes
      const basePrice = 15 + Math.random() * 10
      const baseWaitTime = 2 + Math.floor(Math.random() * 5)

      const simulatedResults = {
        uber: {
          price: `$${(basePrice * 1.05).toFixed(2)}`,
          waitTime: `${baseWaitTime} min`,
          driversNearby: Math.floor(3 + Math.random() * 5),
          service: 'UberX',
        },
        lyft: {
          price: `$${(basePrice * 0.95).toFixed(2)}`,
          waitTime: `${baseWaitTime + 1} min`,
          driversNearby: Math.floor(2 + Math.random() * 4),
          service: 'Lyft Standard',
        },
        taxi: {
          price: `$${(basePrice * 1.2).toFixed(2)}`,
          waitTime: `${baseWaitTime + 3} min`,
          driversNearby: Math.floor(1 + Math.random() * 3),
          service: 'Yellow Cab',
        },
      }

      setResults(simulatedResults)
      setInsights(
        'Based on price and wait time, Lyft appears to be your best option for this trip.'
      )
      setError('Note: Using simulated data due to API connection issues.')
      setShowForm(false)
      // Don't set coordinates for simulated data
    } finally {
      setIsLoading(false)
    }
  }

  // Get user's current location and reverse geocode
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode the coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'RideCompareApp/1.0',
              },
            }
          )
          const data = await response.json()

          if (data.display_name) {
            setPickup(data.display_name)
            // Add haptic feedback if supported
            if (navigator.vibrate) {
              navigator.vibrate(50)
            }
          } else {
            setError('Could not determine your location address.')
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error)
          setError('Failed to get your current address.')
        } finally {
          setIsGettingLocation(false)
        }
      },
      error => {
        console.error('Geolocation error:', error)
        setError('Could not access your location. Please check permissions.')
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  const handleEdit = () => {
    setShowForm(true)
  }

  const handleReset = () => {
    setPickup('')
    setDestination('')
    setResults(null)
    setInsights('')
    setError('')
    setPickupCoords(null)
    setDestinationCoords(null)
    setSuggestions([])
    setDestinationSuggestions([])
    setShowPickupSuggestions(false)
    setShowDestinationSuggestions(false)
    setShowForm(true)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!showForm && results && (
        <RouteHeader
          origin={pickup}
          destination={destination}
          onEdit={handleEdit}
          onReset={handleReset}
        />
      )}

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 relative" ref={pickupRef}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  <label htmlFor="pickup" className="font-medium">
                    Pickup Location
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 touch-none select-none"
                  title="Use my current location"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Locate className="h-4 w-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">Use Location</span>
                  <span className="sm:hidden">📍</span>
                </button>
              </div>
              <div className="relative">
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
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  required
                />
                {/* Mobile-friendly clear button */}
                {pickup && (
                  <button
                    type="button"
                    onClick={() => setPickup('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    ✕
                  </button>
                )}
              </div>

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
                        <div className="font-medium text-sm">
                          {suggestion.name || suggestion.display_name.split(',')[0]}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.display_name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quick airport chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {AIRPORTS.map(airport => (
                  <AirportChip
                    key={`pickup-${airport.code}`}
                    airport={airport}
                    onSelect={() => {
                      setPickup(`${airport.name} (${airport.code}), ${airport.city}, ${airport.state}, USA`)
                      setShowPickupSuggestions(false)
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 relative" ref={destinationRef}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Navigation2 className="h-5 w-5 text-gray-500 mr-2" />
                  <label htmlFor="destination" className="font-medium">
                    Destination
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const temp = pickup
                    setPickup(destination)
                    setDestination(temp)
                    // Add haptic feedback
                    if (navigator.vibrate) {
                      navigator.vibrate(30)
                    }
                  }}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 touch-none select-none"
                  title="Swap pickup and destination"
                  disabled={!pickup || !destination}
                >
                  <span className="text-lg">↕</span>
                  <span className="hidden sm:inline ml-1">Swap</span>
                </button>
              </div>
              <div className="relative">
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
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  required
                />
                {/* Mobile-friendly clear button */}
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    ✕
                  </button>
                )}
              </div>

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
                        <div className="font-medium text-sm">
                          {suggestion.name || suggestion.display_name.split(',')[0]}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.display_name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quick airport chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {AIRPORTS.map(airport => (
                  <AirportChip
                    key={`dest-${airport.code}`}
                    airport={airport}
                    onSelect={() => {
                      setDestination(`${airport.name} (${airport.code}), ${airport.city}, ${airport.state}, USA`)
                      setShowDestinationSuggestions(false)
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
              disabled={isLoading}
              onTouchStart={() => {
                // Add haptic feedback on touch start
                if (navigator.vibrate) {
                  navigator.vibrate(20)
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Finding rides...
                </div>
              ) : (
                'Compare Rides'
              )}
            </button>
            
            {/* reCAPTCHA Protection Indicator */}
            <div className="flex items-center justify-center text-xs text-gray-500 mt-2">
              <Shield className="h-3 w-3 mr-1" />
              {isRecaptchaLoaded ? (
                <span>Protected by reCAPTCHA</span>
              ) : recaptchaError ? (
                <span className="text-orange-500">Security protection loading...</span>
              ) : (
                <span>Loading security protection...</span>
              )}
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <section className="space-y-6">
        {pickupCoords && destinationCoords && (
          <RouteMap
            key={`${pickupCoords[0]}-${pickupCoords[1]}-${destinationCoords[0]}-${destinationCoords[1]}`}
            pickup={pickupCoords}
            destination={destinationCoords}
          />
        )}

        {results && (
          <RideComparisonResults
            results={results}
            insights={insights}
            surgeInfo={surgeInfo}
            timeRecommendations={timeRecommendations}
            pickup={pickup}
            destination={destination}
          />
        )}
      </section>
    </div>
  )
}
