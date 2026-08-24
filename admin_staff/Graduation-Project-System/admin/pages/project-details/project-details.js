document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // URL
    // =========================================================

    const params =
        new URLSearchParams(
            window.location.search
        );

    const projectId =
        params.get("id");


    // =========================================================
    // ELEMENTS
    // =========================================================

    const statusModal =
        document.getElementById(
            "statusModal"
        );

    const openModalBtn =
        document.getElementById(
            "changeStatusBtn"
        );

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );

    const addReviewerBtn =
        document.getElementById(
            "addReviewerBtn"
        );

    const reviewersList =
        document.getElementById(
            "reviewersList"
        );

    const reviewerPickerModal =
        document.getElementById(
            "reviewerPickerModal"
        );

    const closePickerBtn =
        document.getElementById(
            "closePickerBtn"
        );

    const doctorsPickerList =
        document.getElementById(
            "doctorsPickerList"
        );

    const newCommentInput =
        document.getElementById(
            "newCommentInput"
        );

    const commentsList =
        document.getElementById(
            "commentsList"
        );

    const commentsCount =
        document.getElementById(
            "commentsCount"
        );

    const confirmBtn =
        document.getElementById(
            "confirmBtn"
        );

    const projectStatusBadge =
        document.getElementById(
            "projectStatusBadge"
        );

    const projectStatusText =
        document.getElementById(
            "projectStatusText"
        );

    const modalPhaseHint =
        document.getElementById(
            "modalPhaseHint"
        );

    const finalDecisionRow =
        document.getElementById(
            "finalDecisionRow"
        );

    const finalDecisionSelect =
        document.getElementById(
            "finalDecisionSelect"
        );


    // =========================================================
    // STATE
    // =========================================================

    let currentProject = null;

    let teamMembers = [];

    let pendingReviewerPicks = [];

    /*
     * This variable is important.
     *
     * It remembers that this project has already had
     * an assignment before.
     *
     * That means:
     *
     * First assignment  -> POST
     * Re-assignment     -> PUT
     */
    let projectHasPreviousAssignment = false;


    // =========================================================
    // PROJECT ID
    // =========================================================

    if (!projectId) {

        alert(
            "No project selected."
        );

        window.location.href =
            "../projects/index.html";

        return;
    }


    // =========================================================
    // LOAD PROJECT
    // =========================================================

    async function loadProject() {

        try {

            // -------------------------------------------------
            // PROJECT
            // -------------------------------------------------

            currentProject =
                await AdminApi.get(
                    `/projects/${projectId}`
                );


            console.log(
                "===================================="
            );

            console.log(
                "ADMIN PROJECT RESPONSE:",
                currentProject
            );


            // -------------------------------------------------
            // DETECT PREVIOUS ASSIGNMENT
            // -------------------------------------------------

            projectHasPreviousAssignment =
                detectPreviousAssignment(
                    currentProject
                );


            console.log(
                "HAS PREVIOUS ASSIGNMENT:",
                projectHasPreviousAssignment
            );


            // -------------------------------------------------
            // TEAM MEMBERS
            // -------------------------------------------------

            try {

                if (
                    typeof AdminApi.getMembers ===
                    "function"
                ) {

                    teamMembers =
                        await AdminApi.getMembers(
                            currentProject.id
                        );

                } else {

                    teamMembers =
                        await AdminApi.get(
                            `/projects/${currentProject.id}/members`
                        );
                }


                console.log(
                    "TEAM MEMBERS:",
                    teamMembers
                );


                if (
                    !Array.isArray(
                        teamMembers
                    )
                ) {

                    teamMembers = [];
                }

            } catch (membersError) {

                console.error(
                    "LOAD TEAM MEMBERS ERROR:",
                    membersError
                );


                if (
                    Array.isArray(
                        currentProject.team_members
                    )
                ) {

                    teamMembers =
                        currentProject.team_members;

                } else if (
                    Array.isArray(
                        currentProject.members
                    )
                ) {

                    teamMembers =
                        currentProject.members;

                } else {

                    teamMembers = [];
                }
            }


            // -------------------------------------------------
            // RESET TEMPORARY SELECTION
            // -------------------------------------------------

            pendingReviewerPicks = [];


            // -------------------------------------------------
            // RENDER
            // -------------------------------------------------

            renderProjectInfo();

            renderModalState();


        } catch (err) {

            console.error(
                "LOAD PROJECT ERROR:",
                err
            );


            alert(
                err.message ||
                "Could not load this project."
            );
        }
    }


    // =========================================================
    // DETECT PREVIOUS ASSIGNMENT
    // =========================================================

    function detectPreviousAssignment(
        project
    ) {

        if (!project) {
            return false;
        }


        /*
         * Flutter has:
         *
         * detailsModel.hasPreviousAssignment
         *
         * So check the same idea first.
         */

        if (
            project.hasPreviousAssignment === true ||
            project.has_previous_assignment === true ||
            project.hasPreviousAssignments === true ||
            project.has_previous_assignments === true
        ) {

            return true;
        }


        /*
         * Some API responses may return the value
         * as 1 or "true".
         */

        if (
            project.hasPreviousAssignment === 1 ||
            project.hasPreviousAssignment === "true" ||
            project.has_previous_assignment === 1 ||
            project.has_previous_assignment === "true"
        ) {

            return true;
        }


        /*
         * Existing assignments.
         */

        if (
            Array.isArray(
                project.assignments
            ) &&
            project.assignments.length > 0
        ) {

            return true;
        }


        /*
         * Existing reviewers mean the project was
         * assigned before.
         */

        if (
            Array.isArray(
                project.reviewers
            ) &&
            project.reviewers.length > 0
        ) {

            return true;
        }


        /*
         * Existing reviews also mean the project
         * passed through an assignment before.
         */

        if (
            Array.isArray(
                project.reviews
            ) &&
            project.reviews.length > 0
        ) {

            return true;
        }


        /*
         * Singular assignment objects.
         */

        if (
            project.assignment &&
            typeof project.assignment === "object"
        ) {

            return true;
        }


        if (
            project.previousAssignment &&
            typeof project.previousAssignment === "object"
        ) {

            return true;
        }


        if (
            Array.isArray(
                project.previousAssignments
            ) &&
            project.previousAssignments.length > 0
        ) {

            return true;
        }


        /*
         * If the project is currently RevisionSubmitted,
         * it definitely came through a previous review cycle.
         */

        if (
            project.status ===
            "RevisionSubmitted"
        ) {

            return true;
        }


        /*
         * If the project already has a final decision,
         * it necessarily had a previous review/assignment.
         */

        const finalStatuses = [
            "Accepted",
            "Rejected",
            "MinorRevision",
            "MajorRevision",
            "UnderDecision"
        ];


        if (
            finalStatuses.includes(
                project.status
            )
        ) {

            return true;
        }


        return false;
    }


    // =========================================================
    // RENDER PROJECT INFORMATION
    // =========================================================

    function renderProjectInfo() {

        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {
                return;
            }


            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                element.textContent =
                    value;

            } else {

                element.textContent =
                    "—";
            }
        }


        // -----------------------------------------------------
        // TEAM INFORMATION
        // -----------------------------------------------------

        setText(
            "teamDepartment",
            currentProject.department
        );


        setText(
            "teamProgram",
            currentProject.program_name
        );


        setText(
            "teamAcademicYear",
            currentProject.academic_year
        );


        setText(
            "teamRegulation",
            currentProject.regulation
        );


        setText(
            "teamSupervisorDoctor",
            currentProject.supervisor_doctor
        );


        setText(
            "teamSupervisorTa",
            currentProject.supervisor_ta
        );


        // -----------------------------------------------------
        // PROJECT INFORMATION
        // -----------------------------------------------------

        setText(
            "projectTitleAr",
            currentProject.title_ar
        );


        const titleEn =
            document.getElementById(
                "projectTitleEn"
            );


        if (titleEn) {

            titleEn.textContent =
                currentProject.title_en
                    ? `(${currentProject.title_en})`
                    : "";
        }


        setText(
            "projectIdea",
            currentProject.idea
        );


        setText(
            "projectProblem",
            currentProject.problem_definition
        );


        setText(
            "projectObjectives",
            currentProject.objectives
        );


        setText(
            "projectContribution",
            currentProject.expected_contribution
        );


        renderTeamMembers();
    }


    // =========================================================
    // TEAM MEMBERS
    // =========================================================

    function renderTeamMembers() {

        const normalizedMembers =
            Array.isArray(
                teamMembers
            )
                ? teamMembers.map(
                    member => {

                        return {

                            id:
                                member.id ??
                                member.student_id ??
                                member.studentId ??
                                null,

                            name:
                                member.member_name ??
                                member.memberName ??
                                member.full_name ??
                                member.fullName ??
                                member.name ??
                                "—",

                            phone:
                                member.member_phone ??
                                member.memberPhone ??
                                member.phone ??
                                "—",

                            role:
                                member.track_or_role ??
                                member.trackOrRole ??
                                member.role ??
                                "—",

                            studentCode:
                                member.student_code ??
                                member.studentCode ??
                                member.student_id ??
                                member.studentId ??
                                "—",

                            isLeader:
                                member.is_leader === true ||
                                member.is_leader === 1 ||
                                member.is_leader === "true" ||
                                member.isLeader === true ||
                                member.isLeader === 1 ||
                                member.isLeader === "true"
                        };
                    }
                )
                : [];


        function buildMemberCells(
            member
        ) {

            return `
                <td class="arabic-name">
                    ${escapeHtml(
                        member.name
                    )}

                    ${
                        member.isLeader
                            ? `
                                <span class="member-leader-tag">
                                    Leader
                                </span>
                              `
                            : ""
                    }
                </td>

                <td>
                    ${escapeHtml(
                        member.phone
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.role
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.studentCode
                    )}
                </td>
            `;
        }


        const leader =
            normalizedMembers.find(
                member =>
                    member.isLeader === true
            );


        const leaderBody =
            document.getElementById(
                "leaderTableBody"
            );


        if (leaderBody) {

            if (leader) {

                leaderBody.innerHTML =
                    `
                        <tr>
                            ${buildMemberCells(
                                leader
                            )}
                        </tr>
                    `;

            } else {

                leaderBody.innerHTML =
                    `
                        <tr>
                            <td
                                colspan="4"
                                style="
                                    text-align:center;
                                    color:#94A3B8;
                                "
                            >
                                No leader recorded.
                            </td>
                        </tr>
                    `;
            }
        }


        const membersBody =
            document.getElementById(
                "membersTableBody"
            );


        if (membersBody) {

            if (
                normalizedMembers.length > 0
            ) {

                membersBody.innerHTML =
                    normalizedMembers
                        .map(
                            member =>
                                `
                                    <tr>
                                        ${buildMemberCells(
                                            member
                                        )}
                                    </tr>
                                `
                        )
                        .join("");

            } else {

                membersBody.innerHTML =
                    `
                        <tr>
                            <td
                                colspan="4"
                                style="
                                    text-align:center;
                                    color:#94A3B8;
                                "
                            >
                                No members recorded.
                            </td>
                        </tr>
                    `;
            }
        }
    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHtml(
        value
    ) {

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


    // =========================================================
    // GET PHASE
    // =========================================================

    function getPhase(
        status
    ) {

        if (
            status === "Pending"
        ) {

            return "pending";
        }


        if (
            status ===
            "RevisionSubmitted"
        ) {

            return "revisionSubmitted";
        }


        if (
            status ===
            "UnderReview"
        ) {

            return "underReview";
        }


        if (
            status ===
            "UnderDecision"
        ) {

            return "underDecision";
        }


        return "done";
    }


    // =========================================================
    // STATUS LABEL
    // =========================================================

    function formatStatusLabel(
        status
    ) {

        const labels = {

            Pending:
                "Pending",

            RevisionSubmitted:
                "Revision Submitted",

            UnderReview:
                "Under Review",

            UnderDecision:
                "Pending Decision",

            Accepted:
                "Accepted",

            Rejected:
                "Rejected",

            MinorRevision:
                "Minor Revision",

            MajorRevision:
                "Major Revision"
        };


        return (
            labels[status] ||
            status ||
            "Pending"
        );
    }


    // =========================================================
    // STATUS BADGE
    // =========================================================

    function renderStatusBadge(
        status
    ) {

        if (
            !projectStatusBadge ||
            !projectStatusText
        ) {

            return;
        }


        projectStatusText.textContent =
            formatStatusLabel(
                status
            );


        projectStatusBadge.classList.remove(
            "status-under-review",
            "status-under-decision"
        );


        if (
            status ===
            "UnderReview"
        ) {

            projectStatusBadge.classList.add(
                "status-under-review"
            );
        }


        if (
            status ===
            "UnderDecision"
        ) {

            projectStatusBadge.classList.add(
                "status-under-decision"
            );
        }
    }


    // =========================================================
    // RENDER REVIEWERS
    // =========================================================

    function renderReviewersList() {

        if (!reviewersList) {
            return;
        }


        reviewersList.innerHTML =
            "";


        if (!currentProject) {
            return;
        }


        const phase =
            getPhase(
                currentProject.status
            );


        // -----------------------------------------------------
        // TEMPORARY SELECTED REVIEWERS
        // -----------------------------------------------------

        if (
            phase === "pending" ||
            phase === "revisionSubmitted"
        ) {

            pendingReviewerPicks.forEach(
                reviewer => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "reviewer-item";


                    row.innerHTML =
                        `
                            <button
                                type="button"
                                class="btn-delete-reviewer"
                            >
                                <i
                                    class="fa-solid fa-trash-can"
                                ></i>
                            </button>

                            <span>
                                ${escapeHtml(
                                    reviewer.full_name
                                )}
                            </span>
                        `;


                    const deleteBtn =
                        row.querySelector(
                            ".btn-delete-reviewer"
                        );


                    if (deleteBtn) {

                        deleteBtn.addEventListener(
                            "click",
                            function () {

                                pendingReviewerPicks =
                                    pendingReviewerPicks.filter(
                                        item =>
                                            String(
                                                item.id
                                            ) !==
                                            String(
                                                reviewer.id
                                            )
                                    );


                                renderReviewersList();


                                if (
                                    currentProject.status ===
                                    "RevisionSubmitted"
                                ) {

                                    if (
                                        confirmBtn
                                    ) {

                                        confirmBtn.textContent =
                                            pendingReviewerPicks.length > 0
                                                ? "Send for Review"
                                                : "Send Final Decision";
                                    }
                                }
                            }
                        );
                    }


                    reviewersList.appendChild(
                        row
                    );
                }
            );


            return;
        }


        // -----------------------------------------------------
        // SAVED REVIEWERS
        // -----------------------------------------------------

        const reviews =
            Array.isArray(
                currentProject.reviews
            )
                ? currentProject.reviews
                : [];


        const reviewers =
            Array.isArray(
                currentProject.reviewers
            )
                ? currentProject.reviewers
                : [];


        const decisionLabels = {

            Accepted:
                "Accepted",

            Rejected:
                "Rejected",

            MinorRevision:
                "Minor Revision",

            MajorRevision:
                "Major Revision"
        };


        reviewers.forEach(
            reviewer => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "reviewer-item";


                const review =
                    reviews.find(
                        item =>
                            String(
                                item.staff_id
                            ) ===
                            String(
                                reviewer.id
                            )
                    );


                const decision =
                    review &&
                    review.decision
                        ? (
                            decisionLabels[
                                review.decision
                            ] ||
                            review.decision
                        )
                        : "Pending Review";


                row.innerHTML =
                    `
                        <i
                            class="fa-solid fa-user-check"
                            style="color:#16A34A;"
                        ></i>

                        <span
                            style="flex:1;"
                        >
                            <strong>
                                ${escapeHtml(
                                    reviewer.full_name
                                )}
                            </strong>
                        </span>

                        <span
                            class="reviewer-decision"
                        >
                            ${escapeHtml(
                                decision
                            )}
                        </span>
                    `;


                reviewersList.appendChild(
                    row
                );
            }
        );


        // -----------------------------------------------------
        // REVIEWS FALLBACK
        // -----------------------------------------------------

        if (
            reviewers.length === 0 &&
            reviews.length > 0
        ) {

            reviews.forEach(
                review => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "reviewer-item";


                    const decision =
                        review.decision
                            ? (
                                decisionLabels[
                                    review.decision
                                ] ||
                                review.decision
                            )
                            : "Pending Review";


                    row.innerHTML =
                        `
                            <i
                                class="fa-solid fa-user-check"
                                style="color:#16A34A;"
                            ></i>

                            <span
                                style="flex:1;"
                            >
                                <strong>
                                    ${escapeHtml(
                                        review.staff_name ||
                                        "Reviewer"
                                    )}
                                </strong>
                            </span>

                            <span
                                class="reviewer-decision"
                            >
                                ${escapeHtml(
                                    decision
                                )}
                            </span>
                        `;


                    reviewersList.appendChild(
                        row
                    );
                }
            );
        }
    }


    // =========================================================
    // COMMENTS
    // =========================================================

    function addCommentCardDOM(
        author,
        text
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "comment-card";


        card.innerHTML =
            `
                <div class="comment-header">
                    <span class="comment-author">
                        ${escapeHtml(
                            author
                        )}
                    </span>
                </div>

                <div class="comment-text">
                    ${escapeHtml(
                        text
                    )}
                </div>
            `;


        if (commentsList) {

            commentsList.appendChild(
                card
            );
        }
    }


    function renderCommentsList() {

        if (!commentsList) {
            return;
        }


        commentsList.innerHTML =
            "";


        let count = 0;


        (
            currentProject.reviews || []
        ).forEach(
            review => {

                if (!review.comments) {
                    return;
                }


                addCommentCardDOM(
                    review.staff_name ||
                    "Reviewer",
                    review.comments
                );


                count++;
            }
        );


        if (
            currentProject.finalDecision &&
            currentProject.finalDecision.admin_comments
        ) {

            addCommentCardDOM(
                "Admin (Final Decision)",
                currentProject
                    .finalDecision
                    .admin_comments
            );


            count++;
        }


        if (commentsCount) {

            commentsCount.textContent =
                `(${count})`;
        }
    }


    // =========================================================
    // MODAL STATE
    // =========================================================

    function renderModalState() {

        if (!currentProject) {
            return;
        }


        const status =
            currentProject.status;


        const phase =
            getPhase(
                status
            );


        renderStatusBadge(
            status
        );


        renderReviewersList();


        renderCommentsList();


        // -----------------------------------------------------
        // FINAL DECISION VISIBILITY
        // -----------------------------------------------------

        if (
            finalDecisionRow
        ) {

            finalDecisionRow.classList.toggle(
                "hidden",
                phase === "pending" ||
                phase === "underReview"
            );
        }


        // -----------------------------------------------------
        // ADD REVIEWER VISIBILITY
        // -----------------------------------------------------

        if (
            addReviewerBtn
        ) {

            addReviewerBtn.style.display =
                (
                    phase === "pending" ||
                    phase === "revisionSubmitted"
                )
                    ? ""
                    : "none";
        }


        // -----------------------------------------------------
        // PENDING
        // -----------------------------------------------------

        if (
            phase === "pending"
        ) {

            if (
                modalPhaseHint
            ) {

                modalPhaseHint.textContent =
                    "Add a reviewer and send the project for review.";
            }


            if (
                confirmBtn
            ) {

                confirmBtn.textContent =
                    "Send for Review";

                confirmBtn.style.display =
                    "";
            }
        }


        // -----------------------------------------------------
        // REVISION SUBMITTED
        // -----------------------------------------------------

        else if (
            phase ===
            "revisionSubmitted"
        ) {

            if (
                modalPhaseHint
            ) {

                modalPhaseHint.textContent =
                    "The student submitted a revised project. You can assign a reviewer again or send the final decision directly.";
            }


            if (
                confirmBtn
            ) {

                confirmBtn.textContent =
                    pendingReviewerPicks.length > 0
                        ? "Send for Review"
                        : "Send Final Decision";

                confirmBtn.style.display =
                    "";
            }
        }


        // -----------------------------------------------------
        // UNDER REVIEW
        // -----------------------------------------------------

        else if (
            phase ===
            "underReview"
        ) {

            if (
                modalPhaseHint
            ) {

                modalPhaseHint.textContent =
                    "This project is currently under review by staff.";
            }


            if (
                confirmBtn
            ) {

                confirmBtn.style.display =
                    "none";
            }
        }


        // -----------------------------------------------------
        // UNDER DECISION
        // -----------------------------------------------------

        else if (
            phase ===
            "underDecision"
        ) {

            if (
                modalPhaseHint
            ) {

                modalPhaseHint.textContent =
                    "Staff have finished reviewing this project. Select the final decision and send it to the student.";
            }


            if (
                confirmBtn
            ) {

                confirmBtn.textContent =
                    "Send Final Decision";

                confirmBtn.style.display =
                    "";
            }
        }


        // -----------------------------------------------------
        // DONE
        // -----------------------------------------------------

        else {

            if (
                modalPhaseHint
            ) {

                modalPhaseHint.textContent =
                    `This project's final decision is already ${formatStatusLabel(
                        status
                    )}.`;
            }


            if (
                confirmBtn
            ) {

                confirmBtn.style.display =
                    "none";
            }
        }
    }    // =========================================================
    // OPEN STATUS MODAL
    // =========================================================

    if (
        openModalBtn
    ) {

        openModalBtn.addEventListener(
            "click",
            function () {

                if (
                    statusModal
                ) {

                    statusModal.classList.add(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // CLOSE STATUS MODAL
    // =========================================================

    if (
        closeModalBtn
    ) {

        closeModalBtn.addEventListener(
            "click",
            function () {

                if (
                    statusModal
                ) {

                    statusModal.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // ADD REVIEWER
    // =========================================================

    if (
        addReviewerBtn
    ) {

        addReviewerBtn.addEventListener(
            "click",
            function () {

                pendingReviewerPicks = [];


                renderReviewersList();


                renderDoctorsPicker();


                if (
                    reviewerPickerModal
                ) {

                    reviewerPickerModal.classList.add(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // CLOSE REVIEWER PICKER
    // =========================================================

    if (
        closePickerBtn
    ) {

        closePickerBtn.addEventListener(
            "click",
            function () {

                if (
                    reviewerPickerModal
                ) {

                    reviewerPickerModal.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // CLICK OUTSIDE MODALS
    // =========================================================

    window.addEventListener(
        "click",
        function (event) {

            if (
                statusModal &&
                event.target ===
                statusModal
            ) {

                statusModal.classList.remove(
                    "active"
                );
            }


            if (
                reviewerPickerModal &&
                event.target ===
                reviewerPickerModal
            ) {

                reviewerPickerModal.classList.remove(
                    "active"
                );
            }
        }
    );


    // =========================================================
    // LOAD STAFF
    // =========================================================

    async function renderDoctorsPicker() {

        if (
            !doctorsPickerList
        ) {

            return;
        }


        doctorsPickerList.innerHTML =
            `
                <p class="doctors-picker-empty">
                    Loading staff members...
                </p>
            `;


        let doctors = [];


        try {

            doctors =
                typeof StaffStorage !==
                "undefined"
                    ? await StaffStorage.getAll()
                    : [];

        } catch (err) {

            console.error(
                "LOAD STAFF ERROR:",
                err
            );


            doctorsPickerList.innerHTML =
                `
                    <p class="doctors-picker-empty">
                        Could not load staff members:
                        ${escapeHtml(
                            err.message
                        )}
                    </p>
                `;


            return;
        }


        if (
            !Array.isArray(
                doctors
            )
        ) {

            doctors = [];
        }


        doctorsPickerList.innerHTML =
            "";


        const availableDoctors =
            doctors.filter(
                doctor =>
                    !pendingReviewerPicks.some(
                        picked =>
                            String(
                                picked.id
                            ) ===
                            String(
                                doctor.id
                            )
                    )
            );


        if (
            availableDoctors.length ===
            0
        ) {

            doctorsPickerList.innerHTML =
                `
                    <p class="doctors-picker-empty">
                        No more registered staff members to add.
                    </p>
                `;


            return;
        }


        availableDoctors.forEach(
            doctor => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "doctor-pick-item";


                item.innerHTML =
                    `
                        <span>
                            <i
                                class="fa-solid fa-user-doctor"
                            ></i>

                            ${escapeHtml(
                                doctor.full_name
                            )}
                        </span>

                        <i
                            class="fa-solid fa-plus-circle"
                        ></i>
                    `;


                item.addEventListener(
                    "click",
                    function () {

                        const alreadySelected =
                            pendingReviewerPicks.some(
                                picked =>
                                    String(
                                        picked.id
                                    ) ===
                                    String(
                                        doctor.id
                                    )
                            );


                        if (
                            alreadySelected
                        ) {

                            return;
                        }


                        pendingReviewerPicks.push({

                            id:
                                doctor.id,

                            full_name:
                                doctor.full_name
                        });


                        renderReviewersList();


                        if (
                            currentProject &&
                            currentProject.status ===
                            "RevisionSubmitted"
                        ) {

                            if (
                                confirmBtn
                            ) {

                                confirmBtn.textContent =
                                    "Send for Review";
                            }
                        }


                        if (
                            reviewerPickerModal
                        ) {

                            reviewerPickerModal.classList.remove(
                                "active"
                            );
                        }
                    }
                );


                doctorsPickerList.appendChild(
                    item
                );
            }
        );
    }


    // =========================================================
    // SEND PROJECT FOR REVIEW
    // =========================================================

    async function sendProjectForReview() {

        if (
            !currentProject
        ) {

            throw new Error(
                "Project data is not loaded."
            );
        }


        if (
            pendingReviewerPicks.length ===
            0
        ) {

            throw new Error(
                "Please add at least one reviewer."
            );
        }


        const staffIds =
            pendingReviewerPicks.map(
                reviewer =>
                    reviewer.id
            );


        /*
         * IMPORTANT
         *
         * We DO NOT use only the status here.
         *
         * A project can be Pending and still have
         * a previous assignment.
         *
         * Flutter does:
         *
         * hasPreviousAssignment == true
         *      -> reAssignReviewers()
         *
         * hasPreviousAssignment == false
         *      -> assignReviewers()
         */


        const hasPrevious =
            projectHasPreviousAssignment ||
            detectPreviousAssignment(
                currentProject
            );


        console.log(
            "============================================"
        );

        console.log(
            "SEND PROJECT FOR REVIEW"
        );

        console.log(
            "PROJECT ID:",
            currentProject.id
        );

        console.log(
            "PROJECT STATUS:",
            currentProject.status
        );

        console.log(
            "HAS PREVIOUS ASSIGNMENT:",
            hasPrevious
        );

        console.log(
            "STAFF IDS:",
            staffIds
        );


        // =====================================================
        // RE-ASSIGN
        // =====================================================

        if (
            hasPrevious
        ) {

            console.log(
                "USING REASSIGN ENDPOINT"
            );

            console.log(
                `PUT /api/assignments/projects/${currentProject.id}`
            );


            if (
                typeof AdminApi.put !==
                "function"
            ) {

                throw new Error(
                    "AdminApi.put is not available."
                );
            }


            const response =
                await AdminApi.put(
                    `/assignments/projects/${currentProject.id}`,
                    {
                        staffIds:
                            staffIds
                    }
                );


            console.log(
                "REASSIGN REVIEWERS RESPONSE:",
                response
            );


            return true;
        }


        // =====================================================
        // FIRST ASSIGNMENT
        // =====================================================

        console.log(
            "USING FIRST ASSIGNMENT ENDPOINT"
        );

        console.log(
            "POST /api/assignments"
        );


        const response =
            await AdminApi.post(
                "/assignments",
                {
                    projectId:
                        currentProject.id,

                    staffIds:
                        staffIds
                }
            );


        console.log(
            "ASSIGN REVIEWERS RESPONSE:",
            response
        );


        /*
         * Very important:
         *
         * After the first successful assignment,
         * remember that this project now has a
         * previous assignment.
         *
         * So if the student later edits the project
         * and the status becomes Pending again,
         * we still use PUT.
         */

        projectHasPreviousAssignment =
            true;


        return true;
    }


    // =========================================================
    // SEND FINAL DECISION
    // =========================================================

    async function sendFinalDecision() {

        if (
            !currentProject
        ) {

            throw new Error(
                "Project data is not loaded."
            );
        }


        const decision =
            finalDecisionSelect
                ? finalDecisionSelect.value
                : "";


        const commentText =
            newCommentInput
                ? newCommentInput.value.trim()
                : "";


        if (
            !decision
        ) {

            throw new Error(
                "Please select a final decision before sending."
            );
        }


        if (
            decision !== "Accepted" &&
            !commentText
        ) {

            throw new Error(
                "Comments are required unless the decision is Accepted."
            );
        }


        console.log(
            "FINAL DECISION:",
            decision
        );


        const response =
            await AdminApi.post(
                "/reviews/final",
                {
                    projectId:
                        currentProject.id,

                    decision:
                        decision,

                    comments:
                        commentText ||
                        undefined
                }
            );


        console.log(
            "FINAL DECISION RESPONSE:",
            response
        );


        return true;
    }


    // =========================================================
    // CONFIRM BUTTON
    // =========================================================

    if (
        confirmBtn
    ) {

        confirmBtn.addEventListener(
            "click",
            async function () {

                if (
                    !currentProject
                ) {

                    alert(
                        "Project data is not loaded."
                    );

                    return;
                }


                const phase =
                    getPhase(
                        currentProject.status
                    );


                // =================================================
                // PENDING
                // =================================================

                if (
                    phase ===
                    "pending"
                ) {

                    /*
                     * Pending can mean:
                     *
                     * 1. First project submission
                     * 2. Student revised an old project
                     *
                     * sendProjectForReview() decides
                     * POST vs PUT using previous assignment.
                     */


                    if (
                        pendingReviewerPicks.length ===
                        0
                    ) {

                        alert(
                            "Please add at least one reviewer before sending this project for review."
                        );

                        return;
                    }


                    confirmBtn.disabled =
                        true;


                    try {

                        const sentCount =
                            pendingReviewerPicks.length;


                        await sendProjectForReview();


                        await loadProject();


                        alert(
                            `This project has been sent to ${sentCount} reviewer(s) for review.`
                        );


                        if (
                            statusModal
                        ) {

                            statusModal.classList.remove(
                                "active"
                            );
                        }


                    } catch (err) {

                        console.error(
                            "ASSIGNMENT ERROR:",
                            err
                        );


                        alert(
                            err.message ||
                            "Could not send this project for review."
                        );


                    } finally {

                        confirmBtn.disabled =
                            false;
                    }


                    return;
                }


                // =================================================
                // REVISION SUBMITTED
                // =================================================

                if (
                    phase ===
                    "revisionSubmitted"
                ) {

                    /*
                     * Reviewer selected:
                     *
                     *     PUT /assignments/projects/:id
                     *
                     * No reviewer:
                     *
                     *     Final Decision
                     */


                    if (
                        pendingReviewerPicks.length >
                        0
                    ) {

                        confirmBtn.disabled =
                            true;


                        try {

                            const sentCount =
                                pendingReviewerPicks.length;


                            await sendProjectForReview();


                            await loadProject();


                            alert(
                                `The revised project has been sent to ${sentCount} reviewer(s) for review.`
                            );


                            if (
                                statusModal
                            ) {

                                statusModal.classList.remove(
                                    "active"
                                );
                            }


                        } catch (err) {

                            console.error(
                                "REASSIGNMENT ERROR:",
                                err
                            );


                            alert(
                                err.message ||
                                "Could not assign reviewers to the revised project."
                            );


                        } finally {

                            confirmBtn.disabled =
                                false;
                        }


                    } else {

                        confirmBtn.disabled =
                            true;


                        try {

                            await sendFinalDecision();


                            const decision =
                                finalDecisionSelect
                                    ? finalDecisionSelect.value
                                    : "";


                            await loadProject();


                            alert(
                                `The final decision "${formatStatusLabel(
                                    decision
                                )}" has been sent to the student.`
                            );


                            if (
                                statusModal
                            ) {

                                statusModal.classList.remove(
                                    "active"
                                );
                            }


                        } catch (err) {

                            console.error(
                                "FINAL DECISION ERROR:",
                                err
                            );


                            alert(
                                err.message ||
                                "Could not submit the final decision."
                            );


                        } finally {

                            confirmBtn.disabled =
                                false;
                        }
                    }


                    return;
                }


                // =================================================
                // UNDER DECISION
                // =================================================

                if (
                    phase ===
                    "underDecision"
                ) {

                    confirmBtn.disabled =
                        true;


                    try {

                        await sendFinalDecision();


                        const decision =
                            finalDecisionSelect
                                ? finalDecisionSelect.value
                                : "";


                        await loadProject();


                        alert(
                            `The final decision "${formatStatusLabel(
                                decision
                            )}" has been sent to the student.`
                        );


                        if (
                            statusModal
                        ) {

                            statusModal.classList.remove(
                                "active"
                            );
                        }


                    } catch (err) {

                        console.error(
                            "FINAL DECISION ERROR:",
                            err
                        );


                        alert(
                            err.message ||
                            "Could not submit the final decision."
                        );


                    } finally {

                        confirmBtn.disabled =
                            false;
                    }


                    return;
                }


                // =================================================
                // UNDER REVIEW
                // =================================================

                if (
                    phase ===
                    "underReview"
                ) {

                    alert(
                        "This project is currently under review."
                    );


                    return;
                }


                // =================================================
                // DONE
                // =================================================

                alert(
                    "This project has already received its final decision."
                );
            }
        );
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadProject();

});
