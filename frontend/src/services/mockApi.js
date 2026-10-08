const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================
// HELPER
// ============================================
const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
// MATCHING (existing — unchanged)
// ============================================
export const mockRunMatching = async (jd, students) => {
  try {
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
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    throw error;
  }
};

// ============================================
// RECOVERY (existing — unchanged)
// ============================================
export const mockRunRecovery = async (matchResults, jdId = 1) => {
  try {
    const response = await apiFetch(`/api/recovery/run/${jdId}`, { method: 'POST' });
    const updatedResults = matchResults.map(student => {
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
    return updatedResults;
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    throw error;
  }
};

// ============================================
// SIMULATOR (existing — unchanged)
// ============================================
export const mockRunSimulator = async (selectedInterventionIds, matchResults, interventions, jdId = 1) => {
  try {
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
  } catch (error) {
    console.error('❌ Simulator failed:', error);
    throw error;
  }
};

// ============================================
// OPTIMIZER (existing — unchanged)
// ============================================
export const mockRunOptimizer = async (constraints, matchResults, interventions, jdId = 1) => {
  try {
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
  } catch (error) {
    console.error('❌ Optimizer failed:', error);
    throw error;
  }
};

// ============================================
// 🆕 STUDENTS
// ============================================
export const fetchStudents = async () => {
  return await apiFetch('/api/students');
};

export const fetchMyProfile = async (registerNumber) => {
  return await apiFetch(`/api/students/me/${registerNumber}`);
};

// ============================================
// 🆕 ADMIN — USER MANAGEMENT
// ============================================
export const createUser = async (userData, adminRole = 'Admin') => {
  return await apiFetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': adminRole,
    },
    body: JSON.stringify(userData),
  });
};

export const listUsers = async (filters = {}, adminRole = 'Admin') => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.department) params.append('department', filters.department);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiFetch(`/api/admin/users${query}`, {
    headers: { 'x-user-role': adminRole },
  });
};

export const toggleUserStatus = async (userId, status, adminRole = 'Admin') => {
  return await apiFetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': adminRole,
    },
    body: JSON.stringify({ status }),
  });
};

export const resetUserPassword = async (userId, newPassword, adminRole = 'Admin') => {
  return await apiFetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': adminRole,
    },
    body: JSON.stringify({ new_password: newPassword }),
  });
};

// ============================================
// 🆕 ADMIN — DASHBOARD STATS
// ============================================
export const fetchAdminStats = async (adminRole = 'Admin') => {
  return await apiFetch('/api/admin/stats', {
    headers: { 'x-user-role': adminRole },
  });
};

// ============================================
// 🆕 EXCEL IMPORT
// ============================================
export const previewExcelImport = async (file, department, userRole, userDept) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('department', department);

  const response = await fetch(`${API_BASE_URL}/api/import/preview`, {
    method: 'POST',
    headers: {
      'x-user-role': userRole,
      'x-user-department': userDept || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Preview failed: ${error}`);
  }
  return await response.json();
};

export const confirmExcelImport = async (token, fileName, userRole, userDept, userId) => {
  const response = await fetch(`${API_BASE_URL}/api/import/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
      'x-user-department': userDept || '',
      'x-user-id': userId || '',
    },
    body: JSON.stringify({ token, file_name: fileName }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Import failed: ${error}`);
  }
  return await response.json();
};

export const fetchImportHistory = async (userRole, userDept) => {
  return await apiFetch('/api/import/history', {
    headers: {
      'x-user-role': userRole,
      'x-user-department': userDept || '',
    },
  });
};

export const fetchTemplateInfo = async () => {
  return await apiFetch('/api/import/template-info');
};

// ============================================
// 🆕 DELETE OPERATIONS
// ============================================
export const deleteDepartmentStudents = async (department, adminRole = 'Admin') => {
  return await apiFetch(`/api/admin/students/department/${department}`, {
    method: 'DELETE',
    headers: { 'x-user-role': adminRole },
  });
};

export const deleteImportHistory = async (historyId, adminRole = 'Admin') => {
  return await apiFetch(`/api/admin/import-history/${historyId}`, {
    method: 'DELETE',
    headers: { 'x-user-role': adminRole },
  });
};

// ============================================
// 🆕 CLEAR DEPARTMENT STUDENTS (Staff + Admin)
// ============================================
export const clearDepartmentStudents = async (department, userRole, userDept) => {
  return await apiFetch(`/api/import/clear-department/${department}`, {
    method: 'DELETE',
    headers: {
      'x-user-role': userRole,
      'x-user-department': userDept || '',
    },
  });
};

export const deleteImportHistoryRecord = async (historyId, userRole, userDept) => {
  return await apiFetch(`/api/import/history/${historyId}`, {
    method: 'DELETE',
    headers: {
      'x-user-role': userRole,
      'x-user-department': userDept || '',
    },
  });
};

// ============================================
// 🆕 GLOBAL SEARCH
// ============================================
export const globalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return { students: [], users: [], jds: [] };
  }
  return await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
};