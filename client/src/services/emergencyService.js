
import api from './api'

// ADMIN: Fetch all emergency requests
export const getAllEmergencyRequests = async () => {
  const response = await api.get('/emergency/admin/all')
  return response.data.requests
}

// ADMIN: Assign a volunteer to an emergency request
export const assignVolunteer = async (requestId, volunteerId) => {
  const response = await api.put(
    `/emergency/${requestId}/assign`,
    { volunteerId }
  )

  return response.data
}

// USER: Submit an emergency request
export const submitEmergencyRequest = async (requestData) => {
  const response = await api.post('/emergency/request', requestData)
  return response.data
}

// USER: Fetch the logged-in user's emergency requests
export const getMyEmergencyRequests = async () => {
  const response = await api.get('/emergency/my-requests')
  return response.data.requests
}

// VOLUNTEER: Fetch assigned tasks
export const getVolunteerTasks = async () => {
  const response = await api.get('/emergency/volunteer/tasks')
  return response.data.tasks
}
