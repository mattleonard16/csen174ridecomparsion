"use client";

import type { AirportInfo } from '@/lib/airports'

interface Props {
  airport: AirportInfo
  onSelect: () => void
}

export default function AirportChip({ airport, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="px-3 py-1 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-sm transition whitespace-nowrap"
      title={`${airport.name} (${airport.code})`}
    >
      {airport.code}
    </button>
  )
}