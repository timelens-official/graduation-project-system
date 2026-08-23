document.addEventListener("DOMContentLoaded", function () {

    const tableBody =
        document.getElementById("projectsTableBody");

    const searchInput =
        document.getElementById("projectSearchInput");

    const programSelect =
        document.getElementById("programFilter");

    const yearSelect =
        document.getElementById("academicYearFilter");


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    populateFilters();
    loadProjects();


    // =========================================================
    // FILTER EVENTS
    // =========================================================

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            debounce(loadProjects, 300)
        );
    }


    if (programSelect) {
        programSelect.addEventListener(
            "change",
            loadProjects
        );
    }


    if (yearSelect) {
        yearSelect.addEventListener(
            "change",
            loadProjects
        );
    }


    // =========================================================
    // DEBOUNCE
    // =========================================================

    function debounce(fn, delay) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(
                () => fn(...args),
                delay
            );
        };
    }


    // =========================================================
    // POPULATE FILTERS
    // =========================================================

    async function populateFilters() {

        // -----------------------------------------------------
        // Academic Year
        // -----------------------------------------------------

        if (yearSelect) {

            yearSelect.innerHTML = `
                <option value="">
                    Department Year
                </option>

                <option value="2026-2027">
                    2026/2027
                </option>
            `;
        }


        // -----------------------------------------------------
        // Programs
        // -----------------------------------------------------

        if (programSelect) {

            try {

                const programs =
                    await AdminApi.get("/programs");


                programSelect.innerHTML =
                    `
                    <option value="">
                        Program
                    </option>
                    ` +

                    programs
                        .map(
                            (p) =>
                                `
                                <option value="${p.id}">
                                    ${escapeHtml(p.name)}
                                </option>
                                `
                        )
                        .join("");


            } catch (err) {

                console.error(
                    "LOAD PROGRAMS ERROR:",
                    err
                );


                programSelect.innerHTML = `
                    <option value="">
                        Program
                    </option>
                `;
            }
        }
    }


    // =========================================================
    // LOAD PROJECTS
    // =========================================================

    async function loadProjects() {

        const query =
            searchInput
                ? searchInput.value.trim()
                : "";


        const program =
            programSelect
                ? programSelect.value
                : "";


        const academicYear =
            yearSelect
                ? yearSelect.value
                : "";


        // -----------------------------------------------------
        // BUILD QUERY
        // -----------------------------------------------------

        const params =
            new URLSearchParams();


        if (query) {
            params.set(
                "search",
                query
            );
        }


        if (program) {
            params.set(
                "program",
                program
            );
        }


        if (academicYear) {
            params.set(
                "academicYear",
                academicYear
            );
        }


        // -----------------------------------------------------
        // LOADING
        // -----------------------------------------------------

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            color:#94A3B8;
                            padding:24px;
                        "
                    >
                        Loading projects...
                    </td>
                </tr>
            `;
        }


        // -----------------------------------------------------
        // API REQUEST
        // -----------------------------------------------------

        try {

            const projects =
                await AdminApi.get(
                    `/projects/admin${
                        params.toString()
                            ? "?" + params.toString()
                            : ""
                    }`
                );


            console.log(
                "ADMIN PROJECTS:",
                projects
            );


            renderProjects(projects);


        } catch (err) {

            console.error(
                "LOAD PROJECTS ERROR:",
                err
            );


            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            style="
                                text-align:center;
                                color:#EF4444;
                                padding:24px;
                            "
                        >
                            ${escapeHtml(
                                err.message ||
                                "Could not load projects."
                            )}
                        </td>
                    </tr>
                `;
            }
        }
    }


    // =========================================================
    // STATUS FORMAT
    // =========================================================

    function formatStatus(status) {

        const map = {

            Pending: {
                label: "Pending",
                cls: "badge-pending"
            },

            UnderReview: {
                label: "Under Review",
                cls: "badge-review"
            },

            UnderDecision: {
                label: "Pending Decision",
                cls: "badge-decision"
            },

            Accepted: {
                label: "Accepted",
                cls: "badge-accepted"
            },

            Rejected: {
                label: "Rejected",
                cls: "badge-rejected"
            },

            MinorRevision: {
                label: "Minor Revision",
                cls: "badge-minor"
            },

            MajorRevision: {
                label: "Major Revision",
                cls: "badge-major"
            }
        };


        return (
            map[status] || {
                label:
                    status ||
                    "Pending",

                cls:
                    "badge-pending"
            }
        );
    }


    // =========================================================
    // RENDER PROJECTS
    // =========================================================

    function renderProjects(data) {

        if (!tableBody) {
            return;
        }


        tableBody.innerHTML = "";


        // =====================================================
        // NO PROJECTS
        // =====================================================

        if (
            !data ||
            data.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            color:#94A3B8;
                            padding:24px;
                        "
                    >
                        No matching projects found.
                    </td>

                </tr>
            `;

            return;
        }


        // =====================================================
        // LOOP PROJECTS
        // =====================================================

        data.forEach(
            (project, index) => {

                const row =
                    document.createElement("tr");


                // -------------------------------------------------
                // STATUS
                // -------------------------------------------------

                const status =
                    formatStatus(
                        project.status
                    );


                // =================================================
                // MEMBERS COUNT
                // =================================================
                //
                // Backend members_count does NOT include
                // the Team Leader.
                //
                // Example:
                //
                // Backend:
                // members_count = 3
                //
                // Actual team:
                // Leader + 3 members = 4
                //
                // Therefore:
                // totalMembers = members_count + 1
                //
                // We only add 1 if a leader exists.
                // =================================================

                const membersCount =
                    Number(
                        project.members_count
                    ) || 0;


                const hasLeader =
                    project.leader_name !== undefined &&
                    project.leader_name !== null &&
                    String(
                        project.leader_name
                    ).trim() !== "";


                const totalMembers =
                    hasLeader
                        ? membersCount + 1
                        : membersCount;


                // -------------------------------------------------
                // ROW
                // -------------------------------------------------

                row.innerHTML = `

                    <!-- # -->
                    <td>
                        <strong>
                            ${index + 1}
                        </strong>
                    </td>


                    <!-- PROJECT TITLE -->
                    <td>

                        <div
                            class="project-title-cell"
                        >

                            <span
                                class="title-ar"
                            >
                                ${escapeHtml(
                                    project.title_ar ||
                                    ""
                                )}
                            </span>


                            <span
                                class="title-en"
                            >
                                ${
                                    project.title_en
                                        ? `(${escapeHtml(
                                            project.title_en
                                        )})`
                                        : ""
                                }
                            </span>

                        </div>

                    </td>


                    <!-- TEAM LEADER -->
                    <td
                        class="arabic-student-name"
                    >
                        ${escapeHtml(
                            project.leader_name ||
                            "—"
                        )}
                    </td>


                    <!-- TOTAL MEMBERS -->
                    <td>
                        ${totalMembers}
                        Members
                    </td>


                    <!-- STUDENT ID -->
                    <td>
                        ${escapeHtml(
                            project.student_id ||
                            "—"
                        )}
                    </td>


                    <!-- STATUS -->
                    <td>

                        <span
                            class="
                                status-badge
                                ${status.cls}
                            "
                        >
                            ${escapeHtml(
                                status.label
                            )}
                        </span>

                    </td>


                    <!-- VIEW -->
                    <td>

                        <a
                            href="../project-details/index.html?id=${encodeURIComponent(
                                project.id
                            )}"
                            class="btn-icon-view"
                            title="View Details"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-eye
                                "
                            ></i>

                        </a>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );
            }
        );
    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHtml(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return "—";
        }


        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(value);


        return div.innerHTML;
    }

});
