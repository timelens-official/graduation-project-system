// Guard against the browser's back/forward cache (bfcache) showing a stale,
// already-rendered copy of this protected page after logout. On a bfcache
// restore the browser repaints the page from memory without re-running
// DOMContentLoaded, so the check below re-runs on "pageshow" as well —
// event.persisted is true only for a bfcache restore, not a normal load
// (which DOMContentLoaded already covers).
window.addEventListener("pageshow", function (event) {
    if (event.persisted && typeof AdminApi !== "undefined") {
        AdminApi.requireAuth();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Guard: bounce to the login page if there's no active session.
    if (typeof AdminApi !== "undefined") {
        AdminApi.requireAuth();
    }

    const toggleBtn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }

    // Wire up the "Logout" sidebar link wherever it appears.
    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
        const label = link.textContent.trim().toLowerCase();
        if (label === "logout" && typeof AdminApi !== "undefined") {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                AdminApi.logout();
            });
        }
    });
});
