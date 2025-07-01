export interface AirportInfo {
  code: string
  name: string
  city: string
  state: string
  lat: number
  lon: number
  synonyms: string[]
}

export const AIRPORTS: AirportInfo[] = [
  {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    state: 'CA',
    lat: 37.6213,
    lon: -122.3790,
    synonyms: ['sfo', 'san francisco airport'],
  },
  {
    code: 'SJC',
    name: 'San José International Airport',
    city: 'San José',
    state: 'CA',
    lat: 37.3639,
    lon: -121.9289,
    synonyms: ['sjc', 'san jose airport'],
  },
  {
    code: 'OAK',
    name: 'Oakland International Airport',
    city: 'Oakland',
    state: 'CA',
    lat: 37.7126,
    lon: -122.2197,
    synonyms: ['oak', 'oakland airport'],
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    state: 'CA',
    lat: 33.9416,
    lon: -118.4085,
    synonyms: ['lax', 'los angeles airport'],
  },
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    state: 'NY',
    lat: 40.6413,
    lon: -73.7781,
    synonyms: ['jfk', 'kennedy airport'],
  },
  {
    code: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'Newark',
    state: 'NJ',
    lat: 40.6895,
    lon: -74.1745,
    synonyms: ['ewr', 'newark airport'],
  },
  {
    code: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    state: 'IL',
    lat: 41.9742,
    lon: -87.9073,
    synonyms: ['ord', 'chicago ohare airport'],
  },
  {
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    state: 'GA',
    lat: 33.6407,
    lon: -84.4277,
    synonyms: ['atl', 'atlanta airport'],
  },
  {
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    state: 'WA',
    lat: 47.4502,
    lon: -122.3088,
    synonyms: ['sea', 'seatac airport'],
  },
  {
    code: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    state: 'CO',
    lat: 39.8561,
    lon: -104.6737,
    synonyms: ['den', 'denver airport'],
  },
  {
    code: 'BOS',
    name: 'Logan International Airport',
    city: 'Boston',
    state: 'MA',
    lat: 42.3656,
    lon: -71.0096,
    synonyms: ['bos', 'logan airport'],
  },
  {
    code: 'DFW',
    name: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    state: 'TX',
    lat: 32.8998,
    lon: -97.0403,
    synonyms: ['dfw', 'dallas fort worth airport'],
  },
]

// Fast lookup maps
export const AIRPORT_LOOKUP: Record<string, AirportInfo> = AIRPORTS.reduce((acc, airport) => {
  const keys = [airport.code.toLowerCase(), ...airport.synonyms]
  keys.forEach(k => {
    acc[k] = airport
  })
  return acc
}, {} as Record<string, AirportInfo>)

export const AIRPORT_COORDS = AIRPORTS.map(a => [a.lon, a.lat] as const)