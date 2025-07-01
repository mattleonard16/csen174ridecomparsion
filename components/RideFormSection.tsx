'use client'

import RideComparisonForm from '@/components/ride-comparison-form'

interface RideFormSectionProps {
  selectedRoute: { pickup: string, destination: string } | null
  onRouteProcessed: () => void
}

export default function RideFormSection({ selectedRoute, onRouteProcessed }: RideFormSectionProps) {
  return (
    <section className="snap-start min-h-screen flex items-center border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 max-w-3xl w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Compare Prices Now
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
            Enter your pickup and destination to get real-time price comparisons
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200">
          <RideComparisonForm 
            selectedRoute={selectedRoute}
            onRouteProcessed={onRouteProcessed}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We compare prices from multiple services to help you find the best deal. 
            No booking fees or hidden charges.
          </p>
        </div>
      </div>
    </section>
  )
} 