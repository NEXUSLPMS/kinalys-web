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
export async function getOkrObjectives(year?: number, quarter?: number) {
  const params = new URLSearchParams()
  if (year) params.append('year', String(year))
  if (quarter) params.append('quarter', String(quarter))
  const response = await apiClient.get(`/okr/objectives?${params}`)
  return response.data
}

export async function createOkrObjective(data: Record<string, any>) {
  const response = await apiClient.post('/okr/objectives', data)
  return response.data
}

export async function updateOkrObjective(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/okr/objectives/${id}`, data)
  return response.data
}

export async function deleteOkrObjective(id: string) {
  const response = await apiClient.delete(`/okr/objectives/${id}`)
  return response.data
}

export async function getKeyResults(objectiveId: string) {
  const response = await apiClient.get(`/okr/objectives/${objectiveId}/key-results`)
  return response.data
}

export async function createKeyResult(objectiveId: string, data: Record<string, any>) {
  const response = await apiClient.post(`/okr/objectives/${objectiveId}/key-results`, data)
  return response.data
}

export async function updateKeyResult(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/okr/key-results/${id}`, data)
  return response.data
}

export async function getOkrSummary(year?: number, quarter?: number) {
  const params = new URLSearchParams()
  if (year) params.append('year', String(year))
  if (quarter) params.append('quarter', String(quarter))
  const response = await apiClient.get(`/okr/summary?${params}`)
  return response.data
}
export async function getTalentGrid(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/talent/grid${params}`)
  return response.data
}

export async function getTalentAssessments(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/talent/assessments${params}`)
  return response.data
}

export async function setTalentPotential(userId: string, data: Record<string, any>) {
  const response = await apiClient.post(`/talent/assessments/${userId}`, data)
  return response.data
}

export async function seedDemoScorecards() {
  const response = await apiClient.post('/talent/seed-demo')
  return response.data
}
export async function getManagedUsers(filters?: {
  search?: string
  department_id?: string
  role?: string
  employment_status?: string
}) {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.department_id) params.append('department_id', filters.department_id)
  if (filters?.role) params.append('role', filters.role)
  if (filters?.employment_status) params.append('employment_status', filters.employment_status)
  const response = await apiClient.get(`/users/manage?${params}`)
  return response.data
}

export async function updateManagedUser(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/users/${id}/manage`, data)
  return response.data
}

export async function getKpiTemplates(filters?: { designation_id?: string; department_id?: string }) {
  const params = new URLSearchParams()
  if (filters?.designation_id) params.append('designation_id', filters.designation_id)
  if (filters?.department_id) params.append('department_id', filters.department_id)
  const response = await apiClient.get(`/kpi/templates?${params}`)
  return response.data
}

export async function createKpiTemplate(data: Record<string, any>) {
  const response = await apiClient.post('/kpi/templates', data)
  return response.data
}

export async function updateKpiTemplate(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/kpi/templates/${id}`, data)
  return response.data
}

export async function deleteKpiTemplate(id: string) {
  const response = await apiClient.delete(`/kpi/templates/${id}`)
  return response.data
}

export async function applyKpiTemplates(reviewCycleId: string) {
  const response = await apiClient.post('/kpi/templates/apply', { review_cycle_id: reviewCycleId })
  return response.data
}

export async function getKpiAssignments(filters?: { user_id?: string; review_cycle_id?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.user_id) params.append('user_id', filters.user_id)
  if (filters?.review_cycle_id) params.append('review_cycle_id', filters.review_cycle_id)
  if (filters?.status) params.append('status', filters.status)
  const response = await apiClient.get(`/kpi/assignments?${params}`)
  return response.data
}

export async function proposeKpi(data: Record<string, any>) {
  const response = await apiClient.post('/kpi/assignments', data)
  return response.data
}

export async function reviewKpi(id: string, action: string, reason?: string) {
  const response = await apiClient.put(`/kpi/assignments/${id}/review`, { action, reason })
  return response.data
}
export async function getKbCategories() {
  const response = await apiClient.get('/kb/categories')
  return response.data
}

export async function getKbArticles(categorySlug: string) {
  const response = await apiClient.get(`/kb/categories/${categorySlug}/articles`)
  return response.data
}

export async function getKbArticle(slug: string) {
  const response = await apiClient.get(`/kb/articles/${slug}`)
  return response.data
}

export async function markArticleHelpful(slug: string, helpful: boolean) {
  const response = await apiClient.post(`/kb/articles/${slug}/helpful`, { helpful })
  return response.data
}

export async function seedKbArticles() {
  const response = await apiClient.post('/kb/seed')
  return response.data
}

export async function getSupportTickets() {
  const response = await apiClient.get('/support/tickets')
  return response.data
}

export async function createSupportTicket(data: Record<string, any>) {
  const response = await apiClient.post('/support/tickets', data)
  return response.data
}

export async function updateSupportTicket(id: string, data: Record<string, any>) {
  const response = await apiClient.put(`/support/tickets/${id}`, data)
  return response.data
}

export async function getMyScorecard(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/scorecard/me${params}`)
  return response.data
}

export async function updateKpiActual(id: string, actualValue: number) {
  const response = await apiClient.put(`/scorecard/kpi/${id}/actual`, { actual_value: actualValue })
  return response.data
}

export async function getTeamScorecards(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/scorecard/team${params}`)
  return response.data
}

export async function getUserScorecard(userId: string, cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/scorecard/user/${userId}${params}`)
  return response.data
}