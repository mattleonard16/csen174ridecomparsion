"use client"

//To use during the Google Places API script loading
declare global {
  interface Window {
    google: any
  }
}
export { }

import { useState, useEffect, useRef } from "react"
import { MapPin, Navigation2, Loader2 } from "lucide-react"
import RideComparisonResults from "./ride-comparison-results"

export default function RideComparisonForm() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [insights, setInsights] = useState("")
  const [error, setError] = useState("")

  //Loads Google Places API and attached autocomplete to the input fields
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("google-places-script")) {
      const script = document.createElement("script");
      script.id = "google-places-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker`
      script.async = true;

      script.onload = () => {
        if (window.google && window.google.maps.places.PlaceAutocompleteElement) {
          // Pickup
          const pickupDiv = document.getElementById("pickup-autocomplete");
          if (pickupDiv && !pickupDiv.hasChildNodes()) {
            const pickupAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
            pickupDiv.appendChild(pickupAutocomplete);
            pickupAutocomplete.addEventListener("gmp-placeautocomplete-placechanged", () => {
              const place = pickupAutocomplete.getPlace();
              setPickup(place.formatted_address || place.name || "");
            });
          }
          // Destination
          const destinationDiv = document.getElementById("destination-autocomplete");
          if (destinationDiv && !destinationDiv?.hasChildNodes()) {
            const destinationAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
            destinationDiv.appendChild(destinationAutocomplete);
            destinationAutocomplete.addEventListener("gmp-placeautocomplete-placechanged", () => {
              const place = destinationAutocomplete.getPlace()
              setDestination(place.formatted_address || place.name || "")
            });
          }
        }
      };

      document.body.appendChild(script)
    } else {
      // If script already exists, just clean and re-attach the autocomplete elements
      if (window.google && window.google.maps.places.PlaceAutocompleteElement) {
        const pickupDiv = document.getElementById("pickup-autocomplete");
        if (pickupDiv) pickupDiv.innerHTML = "";
        const destinationDiv = document.getElementById("destination-autocomplete");
        if (destinationDiv) destinationDiv.innerHTML = "";

        if (pickupDiv && !pickupDiv.hasChildNodes()) {
          const pickupAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
          pickupDiv.appendChild(pickupAutocomplete);
          pickupAutocomplete.addEventListener("gmp-placeautocomplete-placechanged", () => {
            const place = pickupAutocomplete.getPlace();
            setPickup(place?.formatted_address || "");
          });
        }
        if (destinationDiv && !destinationDiv.hasChildNodes()) {
          const destinationAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
          destinationDiv.appendChild(destinationAutocomplete);
          destinationAutocomplete.addEventListener("gmp-placeautocomplete-placechanged", () => {
            const place = destinationAutocomplete.getPlace();
            setDestination(place?.formatted_address || "");
          });
        }
      }
    }

    return () => {
      //Clean up the autocomplete elements
      const pickupDiv = document.getElementById("pickup-autocomplete")
      if (pickupDiv) pickupDiv.innerHTML = ""
      const destinationDiv = document.getElementById("destination-autocomplete")
      if (destinationDiv) destinationDiv.innerHTML = ""
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setInsights("")
    setError("")

    // Extract values from Shadow DOM manually
    const pickupInput = document
      .querySelector("pickup-autocomplete gmp-place-autocomplete")
      ?.shadowRoot?.querySelector("input");

    const destinationInput = document
      .querySelector("destination-autocomplete gmp-place-autocomplete")
      ?.shadowRoot?.querySelector("input");

    const pickupValue = pickup.trim() || (pickupInput as HTMLInputElement)?.value?.trim() || "";
    const destinationValue = destination.trim() || (destinationInput as HTMLInputElement)?.value?.trim() || "";


    // // Helper to get value from PlaceAutocompleteElement input
    // function getAutocompleteInputValue(containerId: string) {
    //   const div = document.getElementById(containerId)
    //   if (!div) return ""
    //   const gmpElem = div.querySelector("gmp-place-autocomplete")
    //   // Try shadow DOM first
    //   if (gmpElem && gmpElem.shadowRoot) {
    //     const input = gmpElem.shadowRoot.querySelector("input")
    //     if (input && input.value.trim()) return input.value.trim()
    //   }
    //   // Fallback: try direct input (shouldn't happen, but just in case)
    //   const input = div.querySelector("input")
    //   if (input && input.value.trim()) return input.value.trim()
    //   return ""
    // }

    if (!pickupValue || !destinationValue) {
      setIsLoading(false)
      setError("Both pickup and destination addresses are required.")
      return
    }

    try {
      // Call the API route
      const response = await fetch("/api/compare-rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pickup: pickupValue, destination: destinationValue }),
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
              <label htmlFor="pickup-autocomplete" className="font-medium">
                Pickup Location
              </label>
            </div>
            {/* <div id="pickup-autocomplete" className="w-full p-2 border border-gray-300 rounded"> */}
            <div id="pickup-autocomplete" className="w-full">
              {/* <input
              id="pickup"
              ref={pickupRef}
              placeholder="Enter pickup location (e.g., 500 El Camino Real, Santa Clara)"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            /> */}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Navigation2 className="h-5 w-5 text-gray-500 mr-2" />
                <label htmlFor="destination-autocomplete" className="font-medium">
                  Destination
                </label>
              </div>
              <div id="destination-autocomplete" className="w-full">
                {/* <div id="destination-autocomplete" className="w-full p-2 border border-gray-300 rounded"> */}
                {/* <input
              id="destination"
              ref={destinationRef}
              placeholder="Enter destination (e.g., San Francisco Airport)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            /> */}
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
            </div>
          </div>
        </form>
        {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">{error}</div>}
        {results && <RideComparisonResults results={results} insights={insights} />}
      </div>
    </div>
  )
}
