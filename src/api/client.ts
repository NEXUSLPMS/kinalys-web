import axios from 'axios'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Kinalys API Client
// Connects the React frontend to the Fastify backend
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// W-025: environment-driven. Literal kept only as a local-dev fallback so the
// app still runs with no .env. Auth0 values (index.tsx) deliberately have NO
// fallback — a wrong default there fails silently and confusingly.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth: the Auth0 bearer token is attached via setAuthToken (below), which sets
// it on apiClient.defaults — applied to every request automatically. The former
// demo-mode request interceptor that read kinalys_demo_user_id from localStorage
// and sent an X-Demo-User-Id header has been removed (A4 / W-002): it overrode the
// real-auth path. No request interceptor is needed.

export function setAuthToken(token: string) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuthToken() {
  delete apiClient.defaults.headers.common['Authorization']
}

// A4c / D87: read-only view-as. The session id is attached as X-View-As on the
// client defaults; the server validates it (active, unexpired, owned by the
// verified viewer) and resolves the caller as the target read-only.
export function setViewAsHeader(sessionId: string) {
  apiClient.defaults.headers.common['X-View-As'] = sessionId
}

export function clearViewAsHeader() {
  delete apiClient.defaults.headers.common['X-View-As']
}

export async function startViewAs(targetUserId: string) {
  const response = await apiClient.post('/auth/view-as', { target_user_id: targetUserId })
  return response.data
}

export async function endViewAs() {
  const response = await apiClient.post('/auth/view-as/end')
  return response.data
}

// â”€â”€ API functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export async function getKpiTemplates(filters?: { designation_id?: string; department_id?: string; methodology?: string }) {
  const params = new URLSearchParams()
  if (filters?.designation_id) params.append('designation_id', filters.designation_id)
  if (filters?.department_id) params.append('department_id', filters.department_id)
  if (filters?.methodology) params.append('methodology', filters.methodology)
  const response = await apiClient.get('/kpi/templates?' + params.toString())
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

export async function getOneOnOneSessions(status?: string) {
  const params = status ? `?status=${status}` : ''
  const response = await apiClient.get(`/oneonone/sessions${params}`)
  return response.data
}

export async function createOneOnOneSession(data: Record<string, any>) {
  const response = await apiClient.post('/oneonone/sessions', data)
  return response.data
}

export async function getSessionEntries(sessionId: string) {
  const response = await apiClient.get(`/oneonone/sessions/${sessionId}/entries`)
  return response.data
}

export async function saveSessionEntry(sessionId: string, data: Record<string, any>) {
  const response = await apiClient.put(`/oneonone/sessions/${sessionId}/entries`, data)
  return response.data
}

export async function signOffSession(sessionId: string) {
  const response = await apiClient.post(`/oneonone/sessions/${sessionId}/signoff`)
  return response.data
}

export async function getOneOnOneTeam() {
  const response = await apiClient.get('/oneonone/team')
  return response.data
}

export async function getCopcScorecard(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/copc/scorecard${params}`)
  return response.data
}

export async function getCopcTeam(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/copc/team${params}`)
  return response.data
}

export async function getSixSigmaData() {
  return { history: [] }
}

export async function saveSixSigmaData(data: Record<string, any>) {
  return { success: true }
}

export async function getLmsCourses(filters?: { search?: string; category?: string; difficulty?: string }) {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.difficulty) params.append('difficulty', filters.difficulty)
  const response = await apiClient.get(`/lms/courses?${params}`)
  return response.data
}

export async function getMyLearning() {
  const response = await apiClient.get('/lms/my-learning')
  return response.data
}

export async function enrollCourse(courseId: string) {
  const response = await apiClient.post(`/lms/courses/${courseId}/enroll`)
  return response.data
}

export async function updateCourseProgress(enrollmentId: string, progressPct: number) {
  const response = await apiClient.put(`/lms/enrollments/${enrollmentId}/progress`, { progress_pct: progressPct })
  return response.data
}

export async function getLmsCertifications() {
  const response = await apiClient.get('/lms/certifications')
  return response.data
}

export async function getLmsStats() {
  const response = await apiClient.get('/lms/stats')
  return response.data
}

export async function getDashboardStats() {
  const response = await apiClient.get('/dashboard/stats')
  return response.data

}

export async function getCourseSections(courseId: string) {
  const response = await apiClient.get(`/lms/courses/${courseId}/sections`)
  return response.data
}

export async function completeCourseSection(enrollmentId: string, sectionId: string) {
  const response = await apiClient.post(`/lms/enrollments/${enrollmentId}/sections/${sectionId}/complete`)
  return response.data
}

export async function getCompetencyFrameworks() {
  const response = await apiClient.get('/competency/frameworks')
  return response.data
}

export async function getFrameworkCompetencies(code: string) {
  const response = await apiClient.get(`/competency/frameworks/${code}/competencies`)
  return response.data
}

export async function getCompetencySettings() {
  const response = await apiClient.get('/competency/settings')
  return response.data
}

export async function updateCompetencySettings(data: Record<string, any>) {
  const response = await apiClient.put('/competency/settings', data)
  return response.data
}

export async function getMyCompetencyAssessments(cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/competency/assessments/me${params}`)
  return response.data
}

export async function getUserCompetencyAssessments(userId: string, cycleId?: string) {
  const params = cycleId ? `?cycle_id=${cycleId}` : ''
  const response = await apiClient.get(`/competency/assessments/user/${userId}${params}`)
  return response.data
}

export async function saveCompetencyAssessment(userId: string, data: Record<string, any>) {
  const response = await apiClient.put(`/competency/assessments/user/${userId}`, data)
  return response.data
}

export async function getMyTalentPosition() {
  const response = await apiClient.get('/talent/my-position')
  return response.data
}

export async function getMyAlerts() {
  const response = await apiClient.get('/alerts/my')
  return response.data
}

export async function markAlertRead(id: string) {
  const response = await apiClient.put(`/alerts/${id}/read`)
  return response.data
}

export async function markAllAlertsRead() {
  const response = await apiClient.put('/alerts/read-all')
  return response.data
}

export async function getPktQuestions() {
  const response = await apiClient.get('/pkt/questions')
  return response.data
}

export async function createPktQuestion(data: Record<string, any>) {
  const response = await apiClient.post('/pkt/questions', data)
  return response.data
}

export async function deletePktQuestion(id: string) {
  const response = await apiClient.delete(`/pkt/questions/${id}`)
  return response.data
}

export async function startPktTest(count?: number, topic?: string) {
  const params = new URLSearchParams()
  if (count) params.append('count', count.toString())
  if (topic) params.append('topic', topic)
  const response = await apiClient.get(`/pkt/start?${params.toString()}`)
  return response.data
}

export async function submitPktTest(data: { test_id: string; answers: { question_id: string; selected_option: string }[]; time_taken_seconds: number }) {
  const response = await apiClient.post('/pkt/submit', data)
  return response.data
}

export async function getPktHistory() {
  const response = await apiClient.get('/pkt/history')
  return response.data
}

export async function getPktStats() {
  const response = await apiClient.get('/pkt/stats')
  return response.data
}
export async function getCOPCReport() {
  const response = await apiClient.get('/scorecard/copc-report')
  return response.data
}
export async function getSixSigmaReport() {
  const response = await apiClient.get('/scorecard/sixsigma-report')
  return response.data
}
export async function logKpiWarningAcknowledged(data: { kpi_count: number; employee_name: string; manager_name: string; cycle_name: string }) {
  const response = await apiClient.post('/kpi/warning-acknowledged', data)
  return response.data
}
export async function getHrAdmins() {
  const response = await apiClient.get('/users/hr-admins')
  return response.data
}
export async function getPredictiveTeam() {
  const response = await apiClient.get('/predictive/team')
  return response.data
}

export async function getPredictiveMe() {
  const response = await apiClient.get('/predictive/me')
  return response.data
}
export async function submitEmployeeFlag(data: { employee_id: string; flag_type: 'pip' | 'release'; manager_comment: string; performance_snapshot: any; pip_start_date?: string; pip_end_date?: string; pip_form_data?: any }) {
  const response = await apiClient.post('/flags', data)
  return response.data
}

export async function getMyPip() {
  const response = await apiClient.get('/flags/my-pip')
  return response.data
}

export async function acknowledgePip(flagId: string, employeeResponse?: string) {
  const response = await apiClient.put(`/flags/${flagId}/acknowledge`, { employee_response: employeeResponse })
  return response.data
}

export async function getActivePips() {
  const response = await apiClient.get('/flags/active-pips')
  return response.data
}

export async function getPipCheckins(flagId: string) {
  const response = await apiClient.get(`/flags/pip-checkins/${flagId}`)
  return response.data
}

export async function logPipCheckin(data: { flag_id: string; status: string; notes: string; kpi_updates?: Record<string, any> }) {
  const response = await apiClient.post('/flags/pip-checkins', data)
  return response.data
}

export async function closePip(flagId: string, data: { outcome: string; outcome_notes: string }) {
  const response = await apiClient.put(`/flags/${flagId}/close`, data)
  return response.data
}

export async function getEmployeeFlags(employeeId: string) {
  const response = await apiClient.get(`/flags/employee/${employeeId}`)
  return response.data
}

export async function getPendingFlags() {
  const response = await apiClient.get('/flags/pending')
  return response.data
}

export async function getFlagCounts() {
  const response = await apiClient.get('/flags/counts')
  return response.data
}

export async function getClosedFlags() {
  const response = await apiClient.get('/flags/closed')
  return response.data
}

export async function getFlagsReport(params?: { type?: string[]; outcome?: string[]; name?: string }): Promise<string> {
  const qs = new URLSearchParams()
  if (params?.type && params.type.length > 0) qs.set('type', params.type.join(','))
  if (params?.outcome && params.outcome.length > 0) qs.set('outcome', params.outcome.join(','))
  if (params?.name && params.name.trim()) qs.set('name', params.name.trim())
  const query = qs.toString()
  const response = await apiClient.get(`/flags/report${query ? '?' + query : ''}`, { responseType: 'text' })
  return response.data
}

export async function confirmFlagConversation(flagId: string, hrComment: string) {
  const response = await apiClient.put(`/flags/${flagId}/confirm`, { hr_comment: hrComment })
  return response.data
}
export async function delegateFlag(flagId: string, data: { delegate_to: string; due_date: string; delegation_notes: string }) {
  const response = await apiClient.post(`/flags/${flagId}/delegate`, data)
  return response.data
}

export async function getHrExecutives() {
  const response = await apiClient.get('/flags/hr-executives')
  return response.data
}
export async function getMyRecommendations() {
  const response = await apiClient.get('/recommendations/my')
  return response.data
}

export async function getTeamMemberRecommendations(userId: string) {
  const response = await apiClient.get(`/recommendations/team/${userId}`)
  return response.data
}

export async function confirmPipClosure(flagId: string, data: { approved: boolean; hr_notes: string }) {
  const response = await apiClient.put(`/flags/${flagId}/confirm-closure`, data)
  return response.data
}

// ─── Privacy Acknowledgement ──────────────────────────────────────────
// Add these two functions to the END of src/api/client.ts
// (after line 604, after confirmPipClosure)

export async function getPrivacyStatus() {
  const { data } = await apiClient.get('/privacy/status')
  return data as {
    needs_acknowledgement: boolean
    current_version: string
    organization_name: string
    acknowledgement_text: string
    acknowledged_at: string | null
  }
}

export async function acknowledgePrivacy(version: string) {
const { data } = await apiClient.post('/privacy/acknowledge', { acknowledgement_version: version })
return data as {
success: boolean
was_new: boolean
acknowledgement_id: string
acknowledged_at: string
version: string
}
}

export async function softDeleteUser(
  userId: string,
  data: { exit_reason: string; exit_date?: string; notes: string }
) {
  const { data: res } = await apiClient.delete(`/users/${userId}`, { data })
  return res as {
    success: boolean
    message: string
    target_id: string
    was_already_departed: boolean
    departure_event: {
      departure_event_id: string
      was_created: boolean
      billing_year: number
      idempotency_key: string
    }
  }
}

export async function listDepartures(filters?: {
  brief_status?: string
  trigger_source?: string
  from?: string
  to?: string
  limit?: number
}) {
  const params = new URLSearchParams()
  if (filters?.brief_status) params.set('brief_status', filters.brief_status)
  if (filters?.trigger_source) params.set('trigger_source', filters.trigger_source)
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  if (filters?.limit) params.set('limit', String(filters.limit))
  const qs = params.toString()
  const { data } = await apiClient.get(`/departures${qs ? `?${qs}` : ''}`)
  return data as {
    departures: any[]
    count: number
    summary: {
      by_billing_year: Record<string, number>
      by_trigger_source: Record<string, number>
      by_brief_status: Record<string, number>
    }
    filters_applied: Record<string, any>
  }
}

export async function getDeparture(id: string) {
  const { data } = await apiClient.get(`/departures/${id}`)
  return data as { departure: any }
}

export async function generateBrief(departureId: string) {
  const { data } = await apiClient.post(`/departures/${departureId}/generate-brief`, {})
  return data as {
    success: boolean
    brief_id: string
    tokens_input: number
    tokens_output: number
    duration_ms: number
  }
}

export async function getBrief(departureId: string) {
  const { data } = await apiClient.get(`/briefs/${departureId}`)
  return data as { brief: any }
}

// Append this to the END of src/api/client.ts (after getBrief)

export async function suggestBriefsForUser(userId: string) {
  const { data } = await apiClient.get(`/briefs/suggest-for-user/${userId}`)
  return data as {
    suggestions: Array<{
      departure_event_id: string
      employee_id: string
      executive_summary: string
      generated_at: string
      departed_at: string
      employee_name: string
      employee_role: string
    }>
    count: number
    department_id?: string
    reason?: string
  }
}

// Append this to the END of src/api/client.ts (after the last existing function)

export async function getMyAdaptiveAssignments() {
  const { data } = await apiClient.get('/adaptive-learning/my-assignments')
  return data as {
    assignments: Array<{
      enrollment_id: string
      course_id: string
      status: string
      progress_pct: number
      assigned_reason: string
      enrolled_at: string
      due_date: string | null
      course_title: string
      course_description: string | null
      course_category: string | null
      course_difficulty: string | null
      duration_hours: number
      thumbnail_emoji: string | null
      instructor: string | null
      source_kpi_name: string | null
      source_kpi_rag: string | null
      assigned_by_name: string | null
    }>
    total_count: number
    counts_by_reason: Record<string, number>
  }
}