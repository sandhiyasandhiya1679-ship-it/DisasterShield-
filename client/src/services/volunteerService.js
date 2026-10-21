
import api from './api'

// Register a new volunteer
export const registerVolunteer = async (volunteerData) => {
  const response = await api.post('/volunteer/register', volunteerData)
  return response.data
}

// Log in an existing volunteer
export const loginVolunteer = async (credentials) => {
  const response = await api.post('/volunteer/login', credentials)
  return response.data
}

// Fetch volunteers who are currently ACTIVE
export const getAvailableVolunteers = async () => {
  const response = await api.get('/volunteer/map')
  return response.data.volunteers
}

// Fetch the logged-in volunteer's profile
export const getVolunteerProfile = async () => {
  const response = await api.get('/volunteer/profile')
  return response.data.volunteer
}

// Fetch notifications for the logged-in volunteer
export const getVolunteerNotifications = async () => {
  const response = await api.get('/volunteer/notifications')
  return response.data.notifications
}
