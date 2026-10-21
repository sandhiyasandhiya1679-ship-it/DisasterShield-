
import api from './api'

// Fetch all alerts for the admin, including cancelled alerts.
export const getAdminDisasterAlerts = async () => {
  const response = await api.get('/disasters')
  return response.data.alerts
}

// Create and publish a disaster alert.
export const createDisasterAlert = async (alertData) => {
  const response = await api.post('/disasters/create', alertData)
  return response.data
}

// Update an existing alert.
export const updateDisasterAlert = async (id, alertData) => {
  const response = await api.put(`/disasters/${id}`, alertData)
  return response.data
}

// Cancel an alert.
export const cancelDisasterAlert = async (id) => {
  const response = await api.put(`/disasters/${id}/cancel`)
  return response.data
}
