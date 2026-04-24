import axios from 'axios'

// ─────────────────────────────────────────────────────────────
// Kinalys API Client
// Connects the React frontend to the Fastify backend
// ─────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the Auth0 token to every request automatically
export function setAuthToken(token: string) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuthToken() {
  delete apiClient.defaults.headers.common['Authorization']
}

// ── API functions ─────────────────────────────────────────────

export async function getMyProfile() {
  const response = await apiClient.get('/users/me')
  return response.data
}

export async function getTenants() {
  const response = await apiClient.get('/tenants')
  return response.data
}

export async function getDepartments() {
  const response = await apiClient.get('/departments')
  return response.data
}

export async function getDesignations() {
  const response = await apiClient.get('/designations')
  return response.data
}

export async function getStatus() {
  const response = await apiClient.get('/status')
  return response.data
}