
import api from './api'

export const getDisasterAlerts = async () => {
  const response = await api.get('/disasters/active')
  return response.data
}

