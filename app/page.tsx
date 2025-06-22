import RideComparisonForm from "@/components/ride-comparison-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24 bg-gray-50 dark:bg-neutral-900">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mt-16 mb-3 sm:mb-4 text-gray-800 px-2">
          Comparative Rideshares
        </h1>
        <p className="text-center mt-2 mb-6 sm:mb-8 text-base sm:text-lg text-gray-600 px-4">
          Compare prices and wait times across Uber, Lyft & Taxi • Real-time surge pricing • Smart recommendations
        </p>

        <RideComparisonForm />
      </div>
    </main>
  )
}