document.addEventListener("DOMContentLoaded", function () {
    populateFilters();
    loadDashboardStats();
    initRegistrationToggle();

    const programFilter = document.getElementById("programFilter");
    const yearFilter = document.getElementById("academicYearFilter");
    if (programFilter) programFilter.addEventListener("change", loadDashboardStats);
    if (yearFilter) yearFilter.addEventListener("change", loadDashboardStats);
});

// Fills the Program filter with this admin's own department's real
// programs (GET /api/programs). The Academic Year filter is fixed to
// 2026/2027 — the one academic year currently in use.
async function populateFilters() {
    const programSelect = document.getElementById("programFilter");
    const yearSelect = document.getElementById("academicYearFilter");

    // Set first (synchronously, before any await) so there's no window
    // where a stat/project load could fire using a stale value.
    if (yearSelect) {
        yearSelect.innerHTML = `<option value="">Department Year</option><option value="2026-2027">2026/2027</option>`;
    }

    if (programSelect) {
        try {
            const programs = await AdminApi.get("/programs");
            programSelect.innerHTML = programs
                .map((p) => `<option value="${p.id}">${p.name}</option>`)
                .join("");
        } catch (err) {
            programSelect.innerHTML = `<option value="">Program</option>`;
        }
    }
}

async function loadDashboardStats() {
    const programId = document.getElementById("programFilter")?.value || "";
    const academicYear = document.getElementById("academicYearFilter")?.value || "";

    const params = new URLSearchParams();
    if (programId) params.set("program", programId);
    if (academicYear) params.set("academicYear", academicYear);

    try {
        const stats = await AdminApi.get(`/dashboard/stats${params.toString() ? "?" + params.toString() : ""}`);

        document.getElementById("totalProjectsCount").textContent = stats.totalProjects ?? 0;
        document.getElementById("totalStudentsCount").textContent = stats.totalStudents ?? 0;
        // The backend doesn't track "teams" separately — each project is
        // registered by exactly one team, so project count doubles as team count.
        document.getElementById("totalTeamsCount").textContent = stats.totalProjects ?? 0;
    } catch (err) {
        console.error("Could not load dashboard stats:", err);
    }
}

async function initRegistrationToggle() {
    const regStatusContainer = document.getElementById("regStatusContainer");
    const toggleRegBtn = document.getElementById("toggleRegBtn");

    function renderUI(isOpen) {
        if (isOpen) {
            regStatusContainer.innerHTML = `
                <div class="status-open-text">
                    <i class="fa-regular fa-square-check"></i> Registration is Open Now
                </div>
                <div class="status-desc">Students can add and edit projects</div>
            `;
            toggleRegBtn.textContent = "Close Registration";
            toggleRegBtn.style.backgroundColor = "#0D47A1";
        } else {
            regStatusContainer.innerHTML = `
                <div class="status-closed-text">
                    <i class="fa-solid fa-lock"></i> Registration is Closed Now
                </div>
                <div class="status-desc">Students cannot add or edit projects</div>
            `;
            toggleRegBtn.textContent = "Open Registration";
            toggleRegBtn.style.backgroundColor = "#166534";
        }
    }

    let isOpen = true;
    try {
        const settings = await AdminApi.get("/settings");
        isOpen = !!settings.is_registration_open;
    } catch (err) {
        console.error("Could not load registration settings:", err);
    }

    renderUI(isOpen);

    if (toggleRegBtn) {
        toggleRegBtn.addEventListener("click", async function () {
            toggleRegBtn.disabled = true;
            try {
                const updated = await AdminApi.put("/settings/registration", {
                    isRegistrationOpen: !isOpen,
                });
                isOpen = !!updated.is_registration_open;
                renderUI(isOpen);
            } catch (err) {
                alert(err.message || "Could not update registration status.");
            } finally {
                toggleRegBtn.disabled = false;
            }
        });
    }
}
