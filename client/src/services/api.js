
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || ''

    // Admin token is used by default.
    let tokenKey = 'token'

    // User-only endpoints
    if (
      url.startsWith('/disasters/active') ||
      url.startsWith('/shelters/map') ||
      url.startsWith('/auth') ||
      url.startsWith('/emergency/request') ||
      url.startsWith('/emergency/my-requests')
    ) {
      tokenKey = 'userToken'
    }

    // Volunteer-only endpoints
    else if (
      url.startsWith('/volunteer') ||
      url.startsWith('/emergency/volunteer/')
    ) {
      tokenKey = 'volunteerToken'
    }

    const token = localStorage.getItem(tokenKey)

    config.headers = config.headers || {}

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
      console.error(`Missing authentication token: ${tokenKey}`)
    }

    // Never log the actual token.
    console.log('API URL:', url)
    console.log('Selected token key:', tokenKey)
    console.log('Token found:', Boolean(token))

    return config
  },
  (error) => Promise.reject(error)
)

export default api
