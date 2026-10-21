
import api from './api'

// Register a new user
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

// Log in an existing user
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

// Get the logged-in user's profile
export const getUserProfile = async () => {
  const response = await api.get('/auth/profile')
  return response.data
}

// Get notifications for the logged-in user
export const getUserNotifications = async () => {
  const response = await api.get('/auth/notifications')
  return response.data
}

// Mark a notification as read
export const markUserNotificationRead = async (notificationId) => {
  const response = await api.put(
    `/auth/notifications/${notificationId}/read`
  )
  return response.data
}

// Get users for the Admin dashboard
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users')
  return response.data
}
