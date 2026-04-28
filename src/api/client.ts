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

export async function getTenantSettings() {
  const response = await apiClient.get('/tenant/settings')
  return response.data
}

export async function updateTenantSettings(settings: Record<string, any>) {
  const response = await apiClient.put('/tenant/settings', settings)
  return response.data
}

export async function getStatus() {
  const response = await apiClient.get('/status')
  return response.data
}

export async function triggerHrisSync() {
  const response = await apiClient.post('/hris/sync')
  return response.data
}

export async function getHrisSyncHistory() {
  const response = await apiClient.get('/hris/sync/history')
  return response.data
}
export async function getBscPerspectives() {
  const response = await apiClient.get('/bsc/perspectives')
  return response.data
}

export async function updateBscPerspective(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/bsc/perspectives/${id}`, data)
  return response.data
}

export async function getBscMetrics(perspectiveId: string) {
  const response = await apiClient.get(`/bsc/perspectives/${perspectiveId}/metrics`)
  return response.data
}

export async function createBscMetric(perspectiveId: string, data: Record<string, any>) {
  const response = await apiClient.post(`/bsc/perspectives/${perspectiveId}/metrics`, data)
  return response.data
}

export async function deleteBscMetric(metricId: string) {
  const response = await apiClient.delete(`/bsc/metrics/${metricId}`)
  return response.data
}

export async function getReviewCycles() {
  const response = await apiClient.get('/review-cycles')
  return response.data
}