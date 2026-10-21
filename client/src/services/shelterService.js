
import api from './api'

// Fetch shelters for the admin or user map.
export const getShelters = async (dashboardType = 'admin') => {
  const endpoint =
    dashboardType === 'admin'
      ? '/shelters'
      : '/shelters/map'

  const response = await api.get(endpoint)

  return Array.isArray(response.data)
    ? response.data
    : response.data.shelters || []
}

// Create a shelter (admin).
export const createShelter = async (shelterData) => {
  const response = await api.post('/shelters/create', shelterData)
  return response.data
}

// Update a shelter (admin).
export const updateShelter = async (shelterId, shelterData) => {
  const response = await api.put(`/shelters/${shelterId}`, shelterData)
  return response.data
}

// Delete a shelter (admin).
export const deleteShelter = async (shelterId) => {
  const response = await api.delete(`/shelters/${shelterId}`)
  return response.data
}

// Fetch nearby shelters (user).
export const getNearbyShelters = async () => {
  const response = await api.get('/shelters/user')

  return Array.isArray(response.data)
    ? response.data
    : response.data.shelters || []
}