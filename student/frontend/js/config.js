/**
 * App Configuration
 *
 * Single place to point the frontend at the real Backend, and at the
 * separately-hosted Admin/Staff app.
 *
 *   - Backend (Production, fixed):  https://graduation-project-system.vercel.app
 *   - Student frontend:             this app
 *   - Admin/Staff frontend:         a separate deployment
 *
 * HOW THE ADMIN/STAFF ORIGIN IS RESOLVED (in priority order):
 *   1. window.__ADMIN_STAFF_ORIGIN__ — set at request time by the
 *      /api/runtime-config.js serverless function, which reads the real
 *      ADMIN_STAFF_ORIGIN environment variable from the Vercel dashboard.
 *      This is the correct production path: deploy → set the env var →
 *      it works, with no source file ever touched.
 *   2. Local dev fallback — http://localhost:5501, when this page itself
 *      is running on localhost/127.0.0.1.
 *   3. A last-resort guessed URL, only used if the env var was never set
 *      AND this isn't local dev. It assumes the Admin/Staff app was
 *      deployed as a Vercel project named exactly
 *      "graduation-project-system-admin-staff". This is a safety net, not
 *      the intended path — set ADMIN_STAFF_ORIGIN in Vercel instead of
 *      relying on it.
 */
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const RUNTIME_ADMIN_STAFF_ORIGIN = (window.__ADMIN_STAFF_ORIGIN__ || '').trim();
const DEV_ADMIN_STAFF_BASE_URL = 'http://localhost:5501';
const FALLBACK_PROD_ADMIN_STAFF_BASE_URL = 'https://graduation-project-system-admin-staff.vercel.app';

function resolveAdminStaffBaseUrl() {
  if (RUNTIME_ADMIN_STAFF_ORIGIN) return RUNTIME_ADMIN_STAFF_ORIGIN;
  if (isLocalDev) return DEV_ADMIN_STAFF_BASE_URL;
  return FALLBACK_PROD_ADMIN_STAFF_BASE_URL;
}

const AppConfig = {
  API_BASE_URL: 'https://graduation-project-system.vercel.app/api',

  ADMIN_STAFF_BASE_URL: resolveAdminStaffBaseUrl(),
  get ADMIN_DASHBOARD_URL() {
    return this.ADMIN_STAFF_BASE_URL + '/admin/pages/dashboard/index.html';
  },
  get STAFF_DASHBOARD_URL() {
    return this.ADMIN_STAFF_BASE_URL + '/staff/pages/dashboard/index.html';
  },

  // Builds a redirect URL to a page on the (separate-origin) Admin/Staff
  // app, carrying the freshly-issued JWT + user record as one-time query
  // params. localStorage is per-origin, so this page cannot write directly
  // into the Admin/Staff app's storage — the destination page reads these
  // params itself (see admin|staff/shared/js/api.js) and stores them under
  // its own origin before stripping them from the address bar.
  buildCrossOriginRedirect(baseUrl, token, user) {
    // Hard guard: this must always be an ABSOLUTE URL pointing at the
    // Admin/Staff origin, never a filesystem-style relative path like
    // "admin_staff/Graduation-Project-System/...". A relative path here
    // would silently resolve against the CURRENT origin and 404, because
    // the Student origin has no admin_staff folder to serve.
    //
    // If this ever fires, it means config.js has been edited incorrectly
    // (or an old cached copy is being served) — fail loudly instead of
    // producing a confusing 404 after navigation.
    if (typeof baseUrl !== 'string' || !/^https?:\/\//i.test(baseUrl)) {
      throw new Error(
        'Invalid dashboard URL "' + baseUrl + '" — expected an absolute ' +
        'http(s) URL to the Admin/Staff origin (' + this.ADMIN_STAFF_BASE_URL +
        '). Refusing to navigate. This usually means the browser is running ' +
        'a stale cached copy of config.js — hard-refresh (Ctrl/Cmd+Shift+R) ' +
        'or check the ?v= version on the config.js <script> tag.'
      );
    }
    const params = new URLSearchParams();
    params.set('token', token);
    params.set('user', JSON.stringify(user || {}));
    return baseUrl + '?' + params.toString();
  }
};
