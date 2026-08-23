// This standalone Staff login page is no longer the normal entry point —
// Staff now signs in through the central Student Login page (role: Staff),
// which runs on a SEPARATE origin/port (Student frontend on :5500, this
// Admin/Staff frontend on :5501). The file is kept (not deleted) because
// shared/js/api.js still redirects here on session-expiry/401/logout
// (LOGIN_PATH). Anyone who lands here, for any reason, is bounced straight
// to the central login with the Staff role preselected instead of seeing a
// second login form.
//
// Must be an absolute cross-origin URL — a relative path would resolve
// against THIS origin and 404, not reach the Student app's real origin.
//
// Resolution order:
//   1. window.__STUDENT_ORIGIN__ — set at request time by
//      /api/runtime-config.js from the STUDENT_ORIGIN environment variable
//      in this project's Vercel settings. This is the intended production
//      path — no source edit required.
//   2. Local dev fallback (localhost/127.0.0.1 only).
//   3. A last-resort guessed URL, used only if STUDENT_ORIGIN was never
//      set. Set the environment variable instead of relying on it.
const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const runtimeStudentOrigin = (window.__STUDENT_ORIGIN__ || "").trim();
const DEV_STUDENT_BASE_URL = "http://localhost:5500";
const FALLBACK_PROD_STUDENT_BASE_URL = "https://graduation-project-system-student.vercel.app";
const studentBaseUrl = runtimeStudentOrigin
    ? runtimeStudentOrigin
    : (isLocalDev ? DEV_STUDENT_BASE_URL : FALLBACK_PROD_STUDENT_BASE_URL);
const CENTRAL_LOGIN_URL = studentBaseUrl + "/pages/login.html";

document.addEventListener("DOMContentLoaded", function () {
    if (StaffApi.isLoggedIn()) {
        window.location.href = "../dashboard/index.html";
        return;
    }

    window.location.href = CENTRAL_LOGIN_URL + "?role=staff";
});
