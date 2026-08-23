// ============================================================================
// Staff API client
// ----------------------------------------------------------------------------
// Single place that knows how to talk to the backend for the staff portal.
// Every other staff script goes through StaffApi.get/post/put/del instead
// of calling fetch() directly.
// ============================================================================

const StaffApi = (function () {
    const API_BASE_URL = "https://graduation-project-system.vercel.app/api";
    const TOKEN_KEY = "staff_token";
    const USER_KEY = "staff_user_info";
    const LOGIN_PATH = "../login/index.html";

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
    // into this origin's localStorage directly, so after a successful Staff
    // login it redirects here with the token/user as one-time URL query
    // params (see student/frontend/js/config.js buildCrossOriginRedirect).
    // Consume them into this origin's normal staff_token/staff_user_info
    // storage immediately — before requireAuth() runs on this page — then
    // scrub the URL so the token doesn't linger in the address bar/history.
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

        // Logs a staff member in and stores the session. Throws on invalid credentials.
        login: async (username, password) => {
            const data = await request("/auth/staff/login", {
                method: "POST",
                body: { username, password },
                auth: false,
            });
            setSession(data.token, data.staff || { username });
            return data;
        },
    };
})();
