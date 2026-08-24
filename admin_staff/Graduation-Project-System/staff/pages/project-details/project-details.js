/**
 * Staff Project Details Page Logic
 */

(function () {

    // =========================================================
    // BUILD MEMBER ROW
    // =========================================================

    function buildMemberRow(member) {

        const tr = document.createElement("tr");


        // -----------------------------------------------------
        // Name
        // -----------------------------------------------------

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            member.name || "-";


        if (member.isLeader) {

            const tag =
                document.createElement("span");

            tag.className =
                "pd-member-leader-tag";

            tag.textContent =
                "Leader";

            nameCell.append(" ", tag);
        }


        // -----------------------------------------------------
        // Role
        // -----------------------------------------------------

        const roleCell =
            document.createElement("td");

        roleCell.textContent =
            member.role || "-";


        // -----------------------------------------------------
        // Phone
        // -----------------------------------------------------

        const phoneCell =
            document.createElement("td");

        phoneCell.className =
            "member-phone-text";

        phoneCell.textContent =
            member.phone || "-";


        // -----------------------------------------------------
        // Student ID
        // -----------------------------------------------------

        const codeCell =
            document.createElement("td");

        codeCell.textContent =
            member.studentCode || "-";


        tr.append(
            nameCell,
            roleCell,
            phoneCell,
            codeCell
        );


        return tr;
    }


    // =========================================================
    // GET PROJECT ID
    // =========================================================

    function getProjectId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("projectId") ||
            params.get("id")
        );
    }


    // =========================================================
    // LOAD PAGE
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            // -------------------------------------------------
            // Authentication
            // -------------------------------------------------

            if (
                typeof StaffApi === "undefined"
            ) {

                console.error(
                    "StaffApi is not available."
                );

                return;
            }


            StaffApi.requireAuth();


            // -------------------------------------------------
            // Logged-in Staff
            // -------------------------------------------------

            const staff =
                StaffApi.getUser();


            const staffName =
                staff?.full_name ||
                staff?.fullName ||
                staff?.username ||
                "-";


            const loggedInDoctorName =
                document.getElementById(
                    "loggedInDoctorName"
                );


            if (loggedInDoctorName) {

                loggedInDoctorName.textContent =
                    staffName;
            }


            // -------------------------------------------------
            // Project ID
            // -------------------------------------------------

            const projectId =
                getProjectId();


            if (!projectId) {

                Animations?.showToast?.(
                    "Project ID is missing.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // Load assigned project
            // -------------------------------------------------

            let response = null;

            try {

                response =
                    await StaffApi.get(
                        `/assignments/my-projects/${projectId}`
                    );

            } catch (error) {

                console.error(
                    "GET ASSIGNED PROJECT ERROR:",
                    error
                );

                if (
                    typeof Animations !==
                    "undefined" &&
                    Animations.showToast
                ) {

                    Animations.showToast(
                        error.message ||
                        "Could not load project details.",
                        "error"
                    );
                }

                return;
            }


            // =================================================
            // BACKEND RESPONSE
            //
            // data:
            // {
            //   projectInformation,
            //   teamInformation,
            //   teamLeader,
            //   teamMembers,
            //   assignment
            // }
            // =================================================

            const projectInformation =
                response?.projectInformation || {};


            const teamInformation =
                response?.teamInformation || {};


            const teamLeader =
                response?.teamLeader || null;


            const teamMembers =
                Array.isArray(
                    response?.teamMembers
                )
                    ? response.teamMembers
                    : [];


            // =================================================
            // PROJECT CONTENT
            // =================================================

            const projectContent =
                document.getElementById(
                    "project-content"
                );


            if (projectContent) {

                projectContent.classList.add(
                    "fade-up-active"
                );
            }


            // =================================================
            // TEAM INFORMATION
            // =================================================

            const yearElement =
                document.getElementById(
                    "d-year"
                );

            const departmentElement =
                document.getElementById(
                    "d-dept"
                );

            const programElement =
                document.getElementById(
                    "d-program"
                );

            const regulationElement =
                document.getElementById(
                    "d-regulation"
                );

            const doctorElement =
                document.getElementById(
                    "d-supervisor"
                );

            const taElement =
                document.getElementById(
                    "d-assistant-supervisor"
                );


            if (yearElement) {

                yearElement.textContent =
                    projectInformation.academicYear ||
                    "-";
            }


            if (departmentElement) {

                departmentElement.textContent =
                    projectInformation.department ||
                    teamInformation.department ||
                    "-";
            }


            if (programElement) {

                programElement.textContent =
                    projectInformation.programName ||
                    teamInformation.programName ||
                    "-";
            }


            if (regulationElement) {

                regulationElement.textContent =
                    projectInformation.regulation ||
                    "-";
            }


            if (doctorElement) {

                doctorElement.textContent =
                    teamInformation.supervisorDoctor ||
                    "-";
            }


            if (taElement) {

                taElement.textContent =
                    teamInformation.supervisorTa ||
                    "-";
            }


            // =================================================
            // PROJECT INFORMATION
            // =================================================

            const titleElement =
                document.getElementById(
                    "pTitle"
                );

            const ideaElement =
                document.getElementById(
                    "pIdea"
                );

            const problemElement =
                document.getElementById(
                    "pProblem"
                );

            const objectivesElement =
                document.getElementById(
                    "pObjectives"
                );

            const contributionElement =
                document.getElementById(
                    "pContribution"
                );


            if (titleElement) {

                titleElement.textContent =
                    projectInformation.titleEn ||
                    projectInformation.titleAr ||
                    "-";
            }


            if (ideaElement) {

                ideaElement.textContent =
                    projectInformation.idea ||
                    "-";
            }


            if (problemElement) {

                problemElement.textContent =
                    projectInformation.problemDefinition ||
                    "-";
            }


            if (objectivesElement) {

                objectivesElement.textContent =
                    projectInformation.objectives ||
                    "-";
            }


            if (contributionElement) {

                contributionElement.textContent =
                    projectInformation.expectedContribution ||
                    "-";
            }


            // =================================================
            // STATUS
            // =================================================

            const statusBadge =
                document.getElementById(
                    "project-status-badge"
                );

            const statusLabel =
                document.getElementById(
                    "project-status-label"
                );


            if (
                statusBadge &&
                statusLabel
            ) {

                if (
                    typeof App !== "undefined" &&
                    typeof App.applyStatusBadge ===
                    "function"
                ) {

                    App.applyStatusBadge(
                        statusBadge,
                        statusLabel,
                        projectInformation.status
                    );

                } else {

                    statusLabel.textContent =
                        projectInformation.status ||
                        "-";
                }
            }


            // =================================================
            // TEAM LEADER
            // =================================================

            const leaderRow =
                document.getElementById(
                    "d-leader-row"
                );


            if (leaderRow) {

                leaderRow.innerHTML = "";


                if (teamLeader) {

                    leaderRow.appendChild(
                        buildMemberRow({

                            name:
                                teamLeader.name,

                            phone:
                                teamLeader.phone,

                            studentCode:
                                teamLeader.studentCode,

                            role:
                                teamLeader.role ||
                                "Team Leader",

                            isLeader:
                                true

                        })
                    );

                } else {

                    const emptyRow =
                        document.createElement(
                            "tr"
                        );

                    const emptyCell =
                        document.createElement(
                            "td"
                        );

                    emptyCell.colSpan = 4;

                    emptyCell.textContent =
                        "No team leader information available.";

                    emptyCell.className =
                        "empty-table-message";

                    emptyRow.appendChild(
                        emptyCell
                    );

                    leaderRow.appendChild(
                        emptyRow
                    );
                }
            }


            // =================================================
            // TEAM MEMBERS
            // =================================================

            const membersList =
                document.getElementById(
                    "d-members-list"
                );


            const membersCount =
                document.getElementById(
                    "d-members-count"
                );


            if (membersCount) {

                membersCount.textContent =
                    teamMembers.length;
            }


            if (membersList) {

                membersList.innerHTML = "";


                teamMembers.forEach(
                    function (member) {

                        membersList.appendChild(
                            buildMemberRow({

                                name:
                                    member.name,

                                phone:
                                    member.phone,

                                studentCode:
                                    member.studentCode,

                                role:
                                    member.role,

                                isLeader:
                                    Boolean(
                                        member.isLeader
                                    )

                            })
                        );

                    }
                );


                if (
                    teamMembers.length === 0
                ) {

                    const emptyRow =
                        document.createElement(
                            "tr"
                        );

                    const emptyCell =
                        document.createElement(
                            "td"
                        );

                    emptyCell.colSpan = 4;

                    emptyCell.textContent =
                        "No team members found.";

                    emptyCell.className =
                        "empty-table-message";

                    emptyRow.appendChild(
                        emptyCell
                    );

                    membersList.appendChild(
                        emptyRow
                    );
                }
            }


            // =================================================
            // REVIEW MODAL
            //
            // Keep existing review functionality.
            // =================================================

            const openReviewModalBtn =
                document.getElementById(
                    "openReviewModalBtn"
                );

            const reviewModal =
                document.getElementById(
                    "reviewModal"
                );

            const closeModalBtn =
                document.getElementById(
                    "closeModalBtn"
                );

            const cancelModalBtn =
                document.getElementById(
                    "cancelModalBtn"
                );


            if (
                openReviewModalBtn &&
                reviewModal
            ) {

                openReviewModalBtn.addEventListener(
                    "click",
                    function () {

                        reviewModal.classList.add(
                            "active"
                        );

                    }
                );
            }


            function closeReviewModal() {

                if (reviewModal) {

                    reviewModal.classList.remove(
                        "active"
                    );
                }
            }


            if (closeModalBtn) {

                closeModalBtn.addEventListener(
                    "click",
                    closeReviewModal
                );
            }


            if (cancelModalBtn) {

                cancelModalBtn.addEventListener(
                    "click",
                    closeReviewModal
                );
            }


            if (reviewModal) {

                reviewModal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            reviewModal
                        ) {

                            closeReviewModal();
                        }

                    }
                );
            }

        }
    );

})();
