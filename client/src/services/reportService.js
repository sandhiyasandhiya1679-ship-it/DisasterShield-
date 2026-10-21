
import api from './api'

export const getRequestStats = async () => {
  const response = await api.get('/admin/request-stats')
  return response.data.statistics
}

export const getVolunteerStats = async () => {
  const response = await api.get('/admin/volunteer-stats')
  return response.data.statistics
}

export const getAlertStats = async () => {
  const response = await api.get('/admin/alert-stats')
  return response.data.statistics
}
