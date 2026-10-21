
import api from './api'

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard-stats')
  return response.data.statistics
}
