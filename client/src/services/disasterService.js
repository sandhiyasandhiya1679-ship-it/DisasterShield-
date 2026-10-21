
import api from './api'

// Admin: fetch all disaster alerts.
// User: fetch active disaster alerts.
export const getDisasterAlerts = async (dashboardType = 'user') => {
  const endpoint =
    dashboardType === 'admin'
      ? '/disasters'
      : '/disasters/active'

  const response = await api.get(endpoint)

  console.log('Disaster API response:', response.data)

  return Array.isArray(response.data)
    ? response.data
    : response.data.disasters || response.data.alerts || []
}
