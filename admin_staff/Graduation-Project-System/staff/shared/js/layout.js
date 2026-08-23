document.addEventListener("DOMContentLoaded", function () {
    // Guard: bounce to the login page if there's no active session.
    if (typeof StaffApi !== "undefined") {
        StaffApi.requireAuth();
    }

    const toggleBtn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            if (overlay) overlay.classList.toggle("active");
        });
    }

    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    if (sidebar) {
        sidebar.querySelectorAll("a").forEach((link) => {
            const label = link.textContent.trim().toLowerCase();
            if (label === "logout" && typeof StaffApi !== "undefined") {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    StaffApi.logout();
                });
            } else {
                link.addEventListener("click", closeSidebar);
            }
        });
    }
});
