const API_URL = 'http://localhost:5000/api'

export async function getShelters() {
  const response = await fetch(`${API_URL}/shelters/map`)

  if (!response.ok) {
    throw new Error(`Failed to fetch shelters: ${response.status}`)
  }

  const data = await response.json()
  return data.shelters ?? []
}