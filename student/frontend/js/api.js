/**
 * API Client
 *
 * Thin wrapper around fetch() for the real Backend (see
 * backend/src/app.js for the mounted routes). Every backend response
 * follows one of these two shapes (backend/src/utils/response.util.js):
 *
 *   Success: { success: true,  message: string, data: any }
 *   Error:   { success: false, error: { message: string, details: any } }
 *
 * ApiError normalizes both into { status, message, details }.
 */
class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || null;
  }
}

const Api = {
  async request(path, { method = 'GET', body, auth = true, query } = {}) {
    let url = AppConfig.API_BASE_URL + path;

    if (query && Object.keys(query).length) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const qs = params.toString();
      if (qs) url += '?' + qs;
    }

    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
      const token = await Storage.getToken();
      if (token) headers.Authorization = 'Bearer ' + token;
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (networkErr) {
      // The browser throws this same generic TypeError for two very
      // different situations — a true network/DNS failure, and a CORS
      // rejection (preflight failed, or the response lacked the right
      // Access-Control-Allow-Origin header). By design, browsers do not
      // expose which one happened to JS, so we cannot reliably tell them
      // apart here. Logging the request details (not shown to the user)
      // means a developer checking the console — or the backend's own
      // "[CORS] Rejected origin" log — can tell the two apart even though
      // the user-facing message can't.
      console.error(
        `[Api] fetch failed for ${method} ${url} — likely a network error ` +
          'or a CORS rejection (see backend logs for the exact origin if ' +
          'this is CORS).',
        networkErr
      );
      throw new ApiError(
        'Unable to reach the server. Please check your connection and try again.',
        0
      );
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (parseErr) {
      // Non-JSON response (e.g. server crashed with an HTML error page)
      payload = null;
    }

    if (!response.ok) {
      const message =
        (payload && payload.error && payload.error.message) ||
        (payload && payload.message) ||
        'Something went wrong. Please try again.';
      const details = payload && payload.error && payload.error.details;

      if (response.status === 401 && auth) {
        // Token missing/invalid/expired — clear the stale session so the
        // next protected-page load redirects to login instead of looping.
        await Storage.clearSession();
      }

      throw new ApiError(message, response.status, details);
    }

    return payload ? payload.data : null;
  },

  get(path, opts) {
    return this.request(path, { ...opts, method: 'GET' });
  },
  post(path, body, opts) {
    return this.request(path, { ...opts, method: 'POST', body });
  },
  put(path, body, opts) {
    return this.request(path, { ...opts, method: 'PUT', body });
  },
  delete(path, opts) {
    return this.request(path, { ...opts, method: 'DELETE' });
  },

  // ---- Auth ----
  studentRegister({ fullNameArabic, studentId, nationalId }) {
    return this.post(
      '/auth/student/register',
      { fullNameArabic, studentId, nationalId },
      { auth: false }
    );
  },

  studentLogin({ studentId, nationalId }) {
    return this.post(
      '/auth/student/login',
      { studentId, nationalId },
      { auth: false }
    );
  },

  // ---- Admin / Staff (reuse the existing real backend endpoints) ----
  adminLogin({ username, password }) {
    return this.post('/auth/admin/login', { username, password }, { auth: false });
  },

  staffLogin({ username, password }) {
    return this.post('/auth/staff/login', { username, password }, { auth: false });
  },

  // ---- Programs ----
  // Official Student-facing endpoint (Backend-confirmed contract):
  //   GET /api/programs/student?departmentId=<integer>
  // Returns [{ id, name, department_id, is_shared }] for that department
  // plus any shared (e.g. Artificial Intelligence) programs.
  getPrograms(departmentId) {
    return this.get('/programs/student', { query: { departmentId } });
  },

  // ---- Academic Years ----
  // Official Student-facing endpoint: GET /api/academic-years/current.
  // The Backend determines and stores the current academic year
  // automatically — always read it from here, never hardcode/compute it.
  getCurrentAcademicYear() {
    return this.get('/academic-years/current');
  },

  // ---- Settings ----
  // Official Student-facing endpoint:
  //   GET /api/settings/registration-status?departmentId=<integer>
  // Does not require the student's account to have a stored department —
  // departmentId is whatever department the student selected on the form.
  getRegistrationStatus(departmentId) {
    return this.get('/settings/registration-status', { query: { departmentId } });
  },

  // ---- Projects ----
  createProject(projectData) {
    return this.post('/projects', projectData);
  },

  getMyProject() {
    return this.get('/projects/me');
  },

  updateMyProject(projectId, projectData) {
    return this.put('/projects/' + encodeURIComponent(projectId), projectData);
  },

  // ---- Team Members ----
  addLeader(projectId, memberData) {
    return this.post(
      '/team-members/' + encodeURIComponent(projectId) + '/leader',
      memberData
    );
  },

  addMember(projectId, memberData) {
    return this.post(
      '/team-members/' + encodeURIComponent(projectId) + '/members',
      memberData
    );
  },

  getMembers(projectId) {
    return this.get(
      '/team-members/' + encodeURIComponent(projectId) + '/members'
    );
  },

  deleteMember(projectId, memberId) {
    return this.delete(
      '/team-members/' +
        encodeURIComponent(projectId) +
        '/members/' +
        encodeURIComponent(memberId)
    );
  }
};
