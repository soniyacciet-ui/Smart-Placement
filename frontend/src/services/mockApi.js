const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================
// AUTH HELPERS
// ============================================
export const getToken = () => localStorage.getItem('drivex_token');
export const setToken = (token) => localStorage.setItem('drivex_token', token);
export const clearToken = () => localStorage.removeItem('drivex_token');

const authHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ============================================
// CENTRAL FETCH — auto-adds JWT
// ============================================
const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    // Token expired — log out
    clearToken();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
};

// ============================================
// HEALTH
// ============================================
export const testBackendConnection = async () => {
  try {
    const data = await apiFetch('/api/health');
    console.log('✅ Connected to Backend:', data);
    return data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return null;
  }
};

// ============================================
// MATCHING
// ============================================
export const mockRunMatching = async (jd, students) => {
  const createdJD = await apiFetch('/api/jd/upload', {
    method: 'POST',
    body: JSON.stringify(jd),
  });
  await apiFetch(`/api/match/run/${createdJD.id}`, { method: 'POST' });
  const segments = await apiFetch(`/api/match/${createdJD.id}/segments`);
  return segments.map(s => ({
    ...s,
    missingSkills: s.missing_skills,
    readinessScore: s.readiness_score,
  }));
};

// ============================================
// RECOVERY
// ============================================
export const mockRunRecovery = async (matchResults, jdId = 1) => {
  const response = await apiFetch(`/api/recovery/run/${jdId}`, { method: 'POST' });
  return matchResults.map(student => {
    const serverResult = response.results.find(r => r.id === student.id);
    if (!serverResult) return student;
    return {
      ...student,
      status: serverResult.status,
      readinessScore: serverResult.readiness_score,
      recovered: serverResult.recovered,
      originalStatus: serverResult.original_status,
    };
  });
};

// ============================================
// SIMULATOR
// ============================================
export const mockRunSimulator = async (selectedInterventionIds, matchResults, interventions, jdId = 1) => {
  const response = await apiFetch('/api/simulator/run', {
    method: 'POST',
    body: JSON.stringify({
      jd_id: jdId,
      selected_intervention_ids: selectedInterventionIds,
    }),
  });
  const transformedResults = matchResults.map(student => {
    const sim = response.results.find(r => r.id === student.id);
    if (!sim) return { ...student, moveToReady: false };
    return {
      ...student,
      simulatedScore: sim.simulated_score,
      moveToReady: sim.move_to_ready,
    };
  });
  return { results: transformedResults, totalMoved: response.total_moved };
};

// ============================================
// OPTIMIZER
// ============================================
export const mockRunOptimizer = async (constraints, matchResults, interventions, jdId = 1) => {
  const response = await apiFetch('/api/optimizer/run', {
    method: 'POST',
    body: JSON.stringify({
      jd_id: jdId,
      max_budget: constraints.maxBudget,
      max_trainers: constraints.maxTrainers,
    }),
  });
  return {
    recommendedPlan: response.recommended_plan,
    totalCost: response.total_cost,
    totalTrainers: response.total_trainers,
  };
};

// ============================================
// STUDENTS
// ============================================
export const fetchStudents = async () => await apiFetch('/api/students');
export const fetchMyProfile = async (registerNumber) => await apiFetch(`/api/students/me/${registerNumber}`);

// ============================================
// ADMIN — USER MANAGEMENT
// ============================================
export const createUser = async (userData) => {
  return await apiFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const listUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.department) params.append('department', filters.department);
  if (filters.status) params.append('status', filters.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiFetch(`/api/admin/users${query}`);
};

export const toggleUserStatus = async (userId, status) => {
  return await apiFetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const resetUserPassword = async (userId, newPassword) => {
  return await apiFetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ new_password: newPassword }),
  });
};

export const fetchAdminStats = async () => await apiFetch('/api/admin/stats');

// ============================================
// EXCEL IMPORT
// ============================================
export const previewExcelImport = async (file, department) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('department', department);

  const response = await fetch(`${API_BASE_URL}/api/import/preview`, {
    method: 'POST',
    headers: authHeaders(), // NO Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Preview failed: ${error}`);
  }
  return await response.json();
};

export const confirmExcelImport = async (token, fileName) => {
  return await apiFetch('/api/import/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, file_name: fileName }),
  });
};

export const fetchImportHistory = async () => await apiFetch('/api/import/history');
export const fetchTemplateInfo = async () => await apiFetch('/api/import/template-info');

// ============================================
// DELETE OPERATIONS
// ============================================
export const clearDepartmentStudents = async (department) => {
  return await apiFetch(`/api/import/clear-department/${department}`, { method: 'DELETE' });
};

export const deleteImportHistoryRecord = async (historyId) => {
  return await apiFetch(`/api/import/history/${historyId}`, { method: 'DELETE' });
};

// ============================================
// RESUME UPLOAD
// ============================================
export const uploadResume = async (registerNumber, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/resume/upload/${registerNumber}`,
    { method: 'POST', headers: authHeaders(), body: formData }
  );
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
};

// ============================================
// AI SHORTLIST
// ============================================
export const getAIShortlist = async (jdId) => {
  return await apiFetch(`/api/match/ai-shortlist/${jdId}`, { method: 'POST' });
};

// ============================================
// GLOBAL SEARCH
// ============================================
export const globalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return { students: [], users: [], jds: [] };
  }
  return await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
};

// ============================================
// HOD DASHBOARD
// ============================================
export const getHodDepartmentStats = async () => {
  return await apiFetch('/api/hod/department-stats');
};

// ============================================
// RECRUITER SHORTLIST
// ============================================
export const addToShortlist = async (studentId, jdId, notes = '') => {
  return await apiFetch('/api/recruiter/shortlist', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, jd_id: jdId, notes }),
  });
};

export const getShortlist = async (jdId) => {
  return await apiFetch(`/api/recruiter/shortlist/${jdId}`);
};

export const updateShortlistStage = async (shortlistId, stage, notes = null) => {
  const body = { stage };
  if (notes !== null) body.notes = notes;
  return await apiFetch(`/api/recruiter/shortlist/${shortlistId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

export const removeFromShortlist = async (shortlistId) => {
  return await apiFetch(`/api/recruiter/shortlist/${shortlistId}`, { method: 'DELETE' });
};

export const getAvailableCandidates = async (jdId) => {
  return await apiFetch(`/api/recruiter/shortlist-available/${jdId}`);
};