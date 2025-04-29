import RideComparisonForm from "@/components/ride-comparison-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Comparative Rideshares</h1>
        <p className="text-center mb-8 text-lg text-gray-600">
          Compare prices and wait times across multiple rideshare services in one place
        </p>

        <RideComparisonForm />
      </div>
    </main>
  )
}
