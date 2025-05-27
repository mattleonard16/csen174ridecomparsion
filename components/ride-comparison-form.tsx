"use client"

//To use during the Google Places API script loading
declare global {
  interface Window {
    google: typeof google
  }
}
export { }

import { useState, useEffect, useRef } from "react"
import { MapPin, Navigation2, Loader2 } from "lucide-react"
import RideComparisonResults from "./ride-comparison-results"

export default function RideComparisonForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [insights, setInsights] = useState("")
  const [error, setError] = useState("")

  const pickupRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)

  //Loads Google Places API and attaches autocomplete to the input fields
  useEffect(() => {
    const loadScript = () => {
      if (document.getElementById("google-places-script")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "google-places-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=beta`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (pickupRef.current) {
          new window.google.maps.places.Autocomplete(pickupRef.current!)
        }
        if (destinationRef.current) {
          new window.google.maps.places.Autocomplete(destinationRef.current!)
        }
      }
      document.body.appendChild(script);
    };

    if (typeof window !== "undefined") {
      loadScript();
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);
    setInsights("");
    setError("");

    //Use the captured values from the autocomplete listeners
    const pickupValue = pickupRef.current?.value.trim() || ""
    const destinationValue = destinationRef.current?.value.trim() || ""

    console.log("pickup:", pickupValue);
    console.log("destination:", destinationValue);

    if (!pickupValue || !destinationValue) {
      setError("Both pickup and destination addresses are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/compare-rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup: pickupValue, destination: destinationValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch ride comparisons.");
        return;
      }

      setResults(data.comparisons);
      setInsights(data.insights);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unexpected error. Showing fallback data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-500 mr-2" />
              <label htmlFor="pickup" className="font-medium">Pickup Location</label>
            </div>
            <input
              ref={pickupRef}
              id="pickup"
              type='text'
              placeholder="Enter pickup location"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />

            <div className="flex items-center">
              <Navigation2 className="h-5 w-5 text-gray-500 mr-2" />
              <label htmlFor="destination-autocomplete" className="font-medium">Destination</label>
            </div>
            <input
              ref={destinationRef}
              id="destination"
              type="text"
              placeholder="Enter destination"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />

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
        </form>
        {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">{error}</div>}
        {results && <RideComparisonResults results={results} insights={insights} />}
      </div>
    </div>
  )
}
