// ============================================================================
// Admin API client
// ----------------------------------------------------------------------------
// Single place that knows how to talk to the backend for the admin portal:
// where the API lives, how to attach the JWT, and what to do when a request
// fails or the session expires. Every other admin script goes through
// AdminApi.get/post/put/del instead of calling fetch() directly.
//
// Points at the Production backend. To point at a local backend instead,
// change API_BASE_URL below — nothing else needs to change.
// ============================================================================

const AdminApi = (function () {
    const API_BASE_URL = "https://graduation-project-system.vercel.app/api";
    const TOKEN_KEY = "admin_token";
    const USER_KEY = "admin_user";

    // The project's actual main/central login page — a separate origin
    // (see student/frontend/js/config.js, and the same absolute URL already
    // used by admin/pages/login/login.js and staff/pages/login/login.js).
    // Every redirect below points here directly, as an absolute URL, so it
    // is correct from any Admin page regardless of that page's folder depth,
    // and lands on the real central Login page in one hop instead of
    // bouncing through the local admin/pages/login relay first.
    //
    // Resolution order:
    //   1. window.__STUDENT_ORIGIN__ — set at request time by
    //      /api/runtime-config.js from the STUDENT_ORIGIN environment
    //      variable in this project's Vercel settings. This is the
    //      intended production path — no source edit required.
    //   2. Local dev fallback (localhost/127.0.0.1 only).
    //   3. A last-resort guessed URL, used only if STUDENT_ORIGIN was
    //      never set. Set the environment variable instead of relying on it.
    const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const runtimeStudentOrigin = (window.__STUDENT_ORIGIN__ || "").trim();
    const DEV_STUDENT_BASE_URL = "http://localhost:5500";
    const FALLBACK_PROD_STUDENT_BASE_URL = "https://graduation-project-system-student.vercel.app";
    const studentBaseUrl = runtimeStudentOrigin
        ? runtimeStudentOrigin
        : (isLocalDev ? DEV_STUDENT_BASE_URL : FALLBACK_PROD_STUDENT_BASE_URL);
    const CENTRAL_LOGIN_URL = studentBaseUrl + "/pages/login.html";
    const LOGIN_PATH = CENTRAL_LOGIN_URL + "?role=admin";

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch (e) {
            return null;
        }
    }

    function setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    // --- Cross-origin login handoff -----------------------------------------
    // The central Student Login page (a separate origin/port) cannot write
    // into this origin's localStorage directly, so after a successful Admin
    // login it redirects here with the token/user as one-time URL query
    // params (see student/frontend/js/config.js buildCrossOriginRedirect).
    // Consume them into this origin's normal admin_token/admin_user storage
    // immediately — before requireAuth() runs on this page — then scrub the
    // URL so the token doesn't linger in the visible address bar/history.
    (function consumeLoginHandoff() {
        try {
            const params = new URLSearchParams(window.location.search);
            const incomingToken = params.get("token");
            if (!incomingToken) return;

            let incomingUser = {};
            const rawUser = params.get("user");
            if (rawUser) {
                try {
                    incomingUser = JSON.parse(rawUser);
                } catch (e) {
                    incomingUser = {};
                }
            }

            setSession(incomingToken, incomingUser);

            params.delete("token");
            params.delete("user");
            const cleanQuery = params.toString();
            const cleanUrl =
                window.location.pathname +
                (cleanQuery ? "?" + cleanQuery : "") +
                window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
            // Non-fatal — worst case requireAuth() below sends the user
            // back to the login page.
        }
    })();

    function isLoggedIn() {
        return !!getToken();
    }

    // Call this at the top of every protected admin page. Sends the visitor
    // to the login page if there's no token yet.
    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = LOGIN_PATH;
        }
    }

    function logout() {
        clearSession();
        window.location.href = LOGIN_PATH;
    }

    async function request(path, { method = "GET", body, auth = true } = {}) {
        const headers = { "Content-Type": "application/json" };

        if (auth) {
            const token = getToken();
            if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch (networkErr) {
            throw new Error("Could not reach the server. Is the backend running?");
        }

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {
            // No JSON body — leave payload as null.
        }

        if (response.status === 401 && auth) {
            clearSession();
            window.location.href = LOGIN_PATH;
            throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
            const message =
                (payload && payload.error && payload.error.message) ||
                "Something went wrong. Please try again.";
            throw new Error(message);
        }

        return payload ? payload.data : null;
    }

    return {
        API_BASE_URL,
        getToken,
        getUser,
        setSession,
        clearSession,
        isLoggedIn,
        requireAuth,
        logout,

        get: (path) => request(path, { method: "GET" }),
        post: (path, body) => request(path, { method: "POST", body }),
        put: (path, body) => request(path, { method: "PUT", body }),
        del: (path) => request(path, { method: "DELETE" }),

        // Logs an admin in and stores the session. Throws on invalid credentials.
        login: async (username, password) => {
            const data = await request("/auth/admin/login", {
                method: "POST",
                body: { username, password },
                auth: false,
            });
            setSession(data.token, data.admin || { username });
            return data;
        },
    };
})();
