document.addEventListener("DOMContentLoaded", async function () {
    const projectsContainer = document.getElementById("staffProjectsContainer");
    const loggedInDoctorName = document.getElementById("loggedInDoctorName");

    // 1️⃣ اسم الدكتور المسجل دخول حالياً — من الـ session الحقيقي
    const currentStaff = StaffApi.getUser();
    if (loggedInDoctorName) {
        loggedInDoctorName.textContent = (currentStaff && currentStaff.full_name) || "Staff Member";
    }

    // 2️⃣ جلب المشاريع المسندة فعلياً لهذا الدكتور من الباك إند
    //    (GET /api/assignments/my-projects) — بيشمل المشاريع اللي لسه
    //    محتاجة مراجعة والمشاريع اللي خلص فيها القرار كمان.
    projectsContainer.innerHTML = `<div class="empty-state-box"><p class="empty-state-text">Loading your assigned projects...</p></div>`;

    try {
        const assignedProjects = await StaffApi.get("/assignments/my-projects");
        renderStaffProjects(assignedProjects);
    } catch (err) {
        projectsContainer.innerHTML = `<div class="empty-state-box"><p class="empty-state-text">${err.message || "Could not load your projects."}</p></div>`;
    }

    // Maps the backend's raw status values (no spaces) to a readable label.
    function formatStatus(status) {
        const map = {
            Pending: "Pending",
            UnderReview: "Under Review",
            UnderDecision: "Pending Decision",
            Accepted: "Accepted",
            Rejected: "Rejected",
            MinorRevision: "Minor Revision",
            MajorRevision: "Major Revision",
        };
        return map[status] || status || "Pending";
    }

    function renderStaffProjects(projects) {
        if (!projectsContainer) return;
        projectsContainer.innerHTML = "";

        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="empty-state-box">
                    <p class="empty-state-text">No Projects Assigned For Review</p>
                </div>
            `;
            return;
        }

        projects.forEach((project) => {
            const card = document.createElement("div");
            card.className = "project-card";

            const title = project.title_en || project.title_ar || "Untitled Project";
            const assignedDate = project.assigned_at
                ? new Date(project.assigned_at).toLocaleDateString("en-GB")
                : "—";
            // "completed" means this staff member already submitted their review.
            const reviewDone = project.assignment_status === "completed";

            card.innerHTML = `
                <div class="project-main-info">
                    <h3 class="project-title">
                        <i class="fa-regular fa-file-lines" style="color: #2563EB;"></i> 
                        ${title}
                    </h3>
                    <div class="project-meta-details">
                        <span class="project-meta-item">
                            <i class="fa-solid fa-user-group"></i> Leader: ${project.leader_name || "—"}
                        </span>
                        <span class="project-meta-item">
                            Department: ${project.department || "—"}
                        </span>
                        <span class="project-meta-item">
                            <i class="fa-regular fa-calendar-days"></i> Assigned: ${assignedDate}
                        </span>
                    </div>
                </div>

                <div class="project-actions-box">
                    <span class="status-badge ${reviewDone ? "status-success" : "status-warning"}">
                        ● ${reviewDone ? "Reviewed" : formatStatus(project.status)}
                    </span>
                    <a href="../project-details/index.html?id=${project.id}" class="btn btn-outline-primary">
                        Review Project <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;

            projectsContainer.appendChild(card);
        });
    }
});
