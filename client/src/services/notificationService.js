
import api from './api'

export const getAdminNotifications = async () => {
  const response = await api.get('/admin/notifications')
  return response.data.notifications
}
