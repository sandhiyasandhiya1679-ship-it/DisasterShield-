
const API_URL = 'http://localhost:5000/api'

export async function getAvailableVolunteers() {
  const response = await fetch(`${API_URL}/volunteer/map`)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch available volunteers: ${response.status}`
    )
  }

  const data = await response.json()
  return data.volunteers ?? []
}