document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    // =========================================================
    // ELEMENTS
    // =========================================================

    const statusModal =
        document.getElementById("statusModal");

    const closeModalBtn =
        document.getElementById("closeModalBtn");

    // Main Project Details buttons
    const addReviewerActionBtn =
        document.getElementById("addReviewerActionBtn");

    const finalDecisionActionBtn =
        document.getElementById("finalDecisionActionBtn");

    // Modal elements
    const addReviewerBtn =
        document.getElementById("addReviewerBtn");

    const reviewersList =
        document.getElementById("reviewersList");

    const reviewerPickerModal =
        document.getElementById("reviewerPickerModal");

    const closePickerBtn =
        document.getElementById("closePickerBtn");

    const doctorsPickerList =
        document.getElementById("doctorsPickerList");

    const newCommentInput =
        document.getElementById("newCommentInput");

    const commentsList =
        document.getElementById("commentsList");

    const commentsCount =
        document.getElementById("commentsCount");

    const confirmBtn =
        document.getElementById("confirmBtn");

    const projectStatusBadge =
        document.getElementById("projectStatusBadge");

    const projectStatusText =
        document.getElementById("projectStatusText");

    const modalPhaseHint =
        document.getElementById("modalPhaseHint");

    const finalDecisionRow =
        document.getElementById("finalDecisionRow");

    const finalDecisionSelect =
        document.getElementById("finalDecisionSelect");


    // =========================================================
    // STATE
    // =========================================================

    let currentProject = null;

    let teamMembers = [];

    let pendingReviewerPicks = [];

    /*
     * Action modes:
     *
     * null
     * "assignReviewer"
     * "finalDecision"
     * "modal"
     */
    let actionMode = null;


    // =========================================================
    // PROJECT ID CHECK
    // =========================================================

    if (!projectId) {

        alert("No project selected.");

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
            // GET PROJECT
            // -------------------------------------------------

            currentProject =
                await AdminApi.get(
                    `/projects/${projectId}`
                );


            console.log(
                "ADMIN PROJECT RESPONSE:",
                currentProject
            );


            // -------------------------------------------------
            // GET TEAM MEMBERS
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
                    "ADMIN TEAM MEMBERS RESPONSE:",
                    teamMembers
                );


                if (!Array.isArray(teamMembers)) {

                    teamMembers = [];
                }

            } catch (membersError) {

                console.error(
                    "LOAD TEAM MEMBERS ERROR:",
                    membersError
                );


                // -------------------------------------------------
                // FALLBACK
                // -------------------------------------------------

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


            // Reset temporary selections
            pendingReviewerPicks = [];


            // -------------------------------------------------
            // RENDER
            // -------------------------------------------------

            renderProjectInfo();

            renderActionButtons();

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
    // RENDER PROJECT INFORMATION
    // =========================================================

    function renderProjectInfo() {

        const setText =
            (id, value) => {

                const el =
                    document.getElementById(id);


                if (!el) {
                    return;
                }


                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {

                    el.textContent =
                        value;

                } else {

                    el.textContent =
                        "—";
                }
            };


        // =====================================================
        // TEAM INFORMATION
        // =====================================================

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


        // =====================================================
        // PROJECT INFORMATION
        // =====================================================

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

        
        // =====================================================
        // TEAM MEMBERS
        // =====================================================

        renderTeamMembers();
    }


    // =========================================================
    // RENDER TEAM MEMBERS
    // =========================================================

    function renderTeamMembers() {

        console.log(
            "TEAM MEMBERS BEFORE NORMALIZATION:",
            teamMembers
        );


        const normalizedMembers =
            teamMembers.map(
                (member) => {

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
            );


        console.log(
            "NORMALIZED ADMIN MEMBERS:",
            normalizedMembers
        );


        // =====================================================
        // BUILD MEMBER CELLS
        // =====================================================

        const buildMemberCells =
            (member) => {

                return `
                    <td class="arabic-name">
                        ${escapeHtml(member.name)}

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
                        ${escapeHtml(member.phone)}
                    </td>

                    <td>
                        ${escapeHtml(member.role)}
                    </td>

                    <td>
                        ${escapeHtml(member.studentCode)}
                    </td>
                `;
            };


        // =====================================================
        // FIND LEADER
        // =====================================================

        const leader =
            normalizedMembers.find(
                member =>
                    member.isLeader === true
            );


        // =====================================================
        // LEADER TABLE
        // =====================================================

        const leaderBody =
            document.getElementById(
                "leaderTableBody"
            );


        if (leaderBody) {

            if (leader) {

                leaderBody.innerHTML =
                    `
                        <tr>
                            ${buildMemberCells(leader)}
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


        // =====================================================
        // MEMBERS TABLE
        // =====================================================

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
                                        ${buildMemberCells(member)}
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

    function escapeHtml(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return "—";
        }


        const div =
            document.createElement("div");


        div.textContent =
            String(value);


        return div.innerHTML;
    }


    // =========================================================
    // WORKFLOW PHASE
    // =========================================================

    function getPhase(status) {

        if (
            status === "Pending"
        ) {

            return "pending";
        }


        if (
            status === "RevisionSubmitted"
        ) {

            return "revisionSubmitted";
        }


        if (
            status === "UnderReview"
        ) {

            return "underReview";
        }


        if (
            status === "UnderDecision"
        ) {

            return "underDecision";
        }


        return "done";
    }


    // =========================================================
    // STATUS LABEL
    // =========================================================

    function formatStatusLabel(status) {

        const map = {

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
            map[status] ||
            status ||
            "Pending"
        );
    }


    // =========================================================
    // STATUS BADGE
    // =========================================================

    function renderStatusBadge(status) {

        if (
            !projectStatusText ||
            !projectStatusBadge
        ) {

            return;
        }


        projectStatusText.textContent =
            formatStatusLabel(status);


        projectStatusBadge.classList.remove(
            "status-under-review",
            "status-under-decision"
        );


        if (
            status === "UnderReview"
        ) {

            projectStatusBadge.classList.add(
                "status-under-review"
            );
        }


        if (
            status === "UnderDecision"
        ) {

            projectStatusBadge.classList.add(
                "status-under-decision"
            );
        }
    }


    // =========================================================
    // MAIN PROJECT DETAILS BUTTONS
    // =========================================================

    function renderActionButtons() {

        if (!currentProject) {
            return;
        }


        const phase =
            getPhase(
                currentProject.status
            );


        // -----------------------------------------------------
        // ADD REVIEWER
        // -----------------------------------------------------

        if (addReviewerActionBtn) {

            if (
                phase === "pending" ||
                phase === "revisionSubmitted"
            ) {

                addReviewerActionBtn.style.display =
                    "";

            } else {

                addReviewerActionBtn.style.display =
                    "none";
            }
        }


        // -----------------------------------------------------
        // FINAL DECISION
        // -----------------------------------------------------

        if (finalDecisionActionBtn) {

            if (
                phase === "pending" ||
                phase === "revisionSubmitted" ||
                phase === "underDecision"
            ) {

                finalDecisionActionBtn.style.display =
                    "";

            } else {

                finalDecisionActionBtn.style.display =
                    "none";
            }
        }
    }


    // =========================================================
    // REVIEWERS LIST
    // =========================================================

    function renderReviewersList() {

        if (!reviewersList) {
            return;
        }


        reviewersList.innerHTML = "";


        if (!currentProject) {
            return;
        }


        const phase =
            getPhase(
                currentProject.status
            );


        // =====================================================
        // TEMPORARY SELECTED REVIEWERS
        // =====================================================

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
                                title="Remove reviewer"
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
                                        picked =>
                                            String(
                                                picked.id
                                            ) !==
                                            String(
                                                reviewer.id
                                            )
                                    );


                                renderReviewersList();


                                if (
                                    currentProject.status ===
                                    "RevisionSubmitted" &&
                                    confirmBtn
                                ) {

                                    confirmBtn.textContent =
                                        pendingReviewerPicks.length > 0
                                            ? "Send for Review"
                                            : "Send Final Decision";
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


        // =====================================================
        // SAVED REVIEWERS
        // =====================================================

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

                        <span style="flex:1;">
                            <strong>
                                ${escapeHtml(
                                    reviewer.full_name
                                )}
                            </strong>
                        </span>

                        <span class="reviewer-decision">
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


        // =====================================================
        // FALLBACK IF ONLY REVIEWS EXIST
        // =====================================================

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

                            <span style="flex:1;">
                                <strong>
                                    ${escapeHtml(
                                        review.staff_name
                                    )}
                                </strong>
                            </span>

                            <span class="reviewer-decision">
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
                        ${escapeHtml(author)}
                    </span>
                </div>

                <div class="comment-text">
                    ${escapeHtml(text)}
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


        commentsList.innerHTML = "";


        let count = 0;


        const reviews =
            Array.isArray(
                currentProject.reviews
            )
                ? currentProject.reviews
                : [];


        reviews.forEach(
            review => {

                if (
                    !review.comments
                ) {

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


        // -----------------------------------------------------
        // FINAL DECISION COMMENT
        // -----------------------------------------------------

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
            getPhase(status);


        renderStatusBadge(status);

        renderActionButtons();

        renderReviewersList();

        renderCommentsList();


        // =====================================================
        // FINAL DECISION ROW
        // =====================================================

        if (finalDecisionRow) {

            /*
             * Final Decision is available:
             *
             * Pending
             * RevisionSubmitted
             * UnderDecision
             *
             * Hidden while UnderReview.
             *
             * Hidden after final decision.
             */

            finalDecisionRow.classList.toggle(
                "hidden",
                phase === "underReview" ||
                phase === "done"
            );
        }


        // =====================================================
        // MODAL ADD REVIEWER
        // =====================================================

        if (addReviewerBtn) {

            addReviewerBtn.style.display =
                (
                    phase === "pending" ||
                    phase === "revisionSubmitted"
                )
                    ? ""
                    : "none";
        }


        // =====================================================
        // PENDING
        // =====================================================

        if (
            phase === "pending"
        ) {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    actionMode === "finalDecision"
                        ? "Select the final decision and send it directly to the student."
                        : "Add a reviewer or send a final decision directly to the student.";
            }


            if (confirmBtn) {

                confirmBtn.textContent =
                    actionMode === "finalDecision"
                        ? "Send Final Decision"
                        : "Send for Review";


                confirmBtn.style.display =
                    "";
            }
        }


        // =====================================================
        // REVISION SUBMITTED
        // =====================================================

        else if (
            phase === "revisionSubmitted"
        ) {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    actionMode === "finalDecision"
                        ? "The student submitted a revision. You can send the final decision directly."
                        : "The student submitted a revision. You can assign a reviewer again or make the final decision directly.";
            }


            if (confirmBtn) {

                if (
                    actionMode ===
                    "finalDecision"
                ) {

                    confirmBtn.textContent =
                        "Send Final Decision";

                } else {

                    confirmBtn.textContent =
                        pendingReviewerPicks.length > 0
                            ? "Send for Review"
                            : "Send Final Decision";
                }


                confirmBtn.style.display =
                    "";
            }
        }


        // =====================================================
        // UNDER REVIEW
        // =====================================================

        else if (
            phase === "underReview"
        ) {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    "This project is currently under review by staff.";
            }


            if (confirmBtn) {

                confirmBtn.style.display =
                    "none";
            }
        }


        // =====================================================
        // UNDER DECISION
        // =====================================================

        else if (
            phase === "underDecision"
        ) {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    "Staff have finished reviewing this project. Select the final decision and send it to the student.";
            }


            if (confirmBtn) {

                confirmBtn.textContent =
                    "Send Final Decision";


                confirmBtn.style.display =
                    "";
            }
        }


        // =====================================================
        // DONE
        // =====================================================

        else {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    `This project has already received its final decision: ${formatStatusLabel(
                        status
                    )}.`;
            }


            if (confirmBtn) {

                confirmBtn.style.display =
                    "none";
            }
        }
    }


    // =========================================================
    // MAIN BUTTON - ADD REVIEWER
    // =========================================================

    if (
        addReviewerActionBtn
    ) {

        addReviewerActionBtn.addEventListener(
            "click",
            function () {

                if (!currentProject) {
                    return;
                }


                const phase =
                    getPhase(
                        currentProject.status
                    );


                if (
                    phase !== "pending" &&
                    phase !== "revisionSubmitted"
                ) {

                    alert(
                        "A reviewer can only be assigned when the project is pending or a revision has been submitted."
                    );

                    return;
                }


                actionMode =
                    "assignReviewer";


                pendingReviewerPicks = [];


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
    // MAIN BUTTON - FINAL DECISION
    // =========================================================

    if (
        finalDecisionActionBtn
    ) {

        finalDecisionActionBtn.addEventListener(
            "click",
            function () {

                if (!currentProject) {
                    return;
                }


                const phase =
                    getPhase(
                        currentProject.status
                    );


                if (
                    phase !== "pending" &&
                    phase !== "revisionSubmitted" &&
                    phase !== "underDecision"
                ) {

                    alert(
                        "Final Decision is not available while the project is under review."
                    );

                    return;
                }


                actionMode =
                    "finalDecision";


                pendingReviewerPicks = [];


                if (
                    finalDecisionSelect
                ) {

                    finalDecisionSelect.value =
                        "";
                }


                if (
                    newCommentInput
                ) {

                    newCommentInput.value =
                        "";
                }


                renderModalState();


                if (statusModal) {

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

                if (statusModal) {

                    statusModal.classList.remove(
                        "active"
                    );
                }


                actionMode =
                    null;


                pendingReviewerPicks =
                    [];
            }
        );
    }


    // =========================================================
    // OLD MODAL ADD REVIEWER
    // =========================================================

    if (
        addReviewerBtn
    ) {

        addReviewerBtn.addEventListener(
            "click",
            function () {

                actionMode =
                    "modal";


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


                actionMode =
                    null;


                pendingReviewerPicks =
                    [];
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
    // LOAD STAFF MEMBERS
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

            if (
                typeof StaffStorage !==
                "undefined" &&
                typeof StaffStorage.getAll ===
                "function"
            ) {

                doctors =
                    await StaffStorage.getAll();

            } else {

                doctors = [];
            }

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
            !Array.isArray(doctors)
        ) {

            doctors = [];
        }


        doctorsPickerList.innerHTML =
            "";


        const availableDoctors =
            doctors.filter(
                doctor => {

                    return !pendingReviewerPicks.some(
                        picked =>
                            String(
                                picked.id
                            ) ===
                            String(
                                doctor.id
                            )
                    );
                }
            );


        if (
            availableDoctors.length === 0
        ) {

            doctorsPickerList.innerHTML =
                `
                    <p class="doctors-picker-empty">
                        No registered staff members available.
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


                // IMPORTANT:
                // This MUST be async because we use await below.
                item.addEventListener(
                    "click",
                    async function () {

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


                        // -------------------------------------------------
                        // MAIN PROJECT DETAILS -> ADD REVIEWER
                        // -------------------------------------------------

                        if (
                            actionMode ===
                            "assignReviewer"
                        ) {

                            const selectedCount =
                                pendingReviewerPicks.length;


                            if (
                                addReviewerActionBtn
                            ) {

                                addReviewerActionBtn.disabled =
                                    true;
                            }


                            try {

                                await sendProjectForReview();


                                await loadProject();


                                alert(
                                    `Reviewer assigned successfully. ${selectedCount} reviewer(s) assigned.`
                                );


                            } catch (err) {

                                console.error(
                                    "DIRECT REVIEWER ASSIGNMENT ERROR:",
                                    err
                                );


                                alert(
                                    err.message ||
                                    "Could not assign the reviewer."
                                );


                            } finally {

                                if (
                                    addReviewerActionBtn
                                ) {

                                    addReviewerActionBtn.disabled =
                                        false;
                                }


                                actionMode =
                                    null;
                            }


                            if (
                                reviewerPickerModal
                            ) {

                                reviewerPickerModal.classList.remove(
                                    "active"
                                );
                            }


                            return;
                        }


                        // -------------------------------------------------
                        // OLD MODAL WORKFLOW
                        // -------------------------------------------------

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
    }    // =========================================================
    // SEND PROJECT FOR REVIEW
    // =========================================================

    async function sendProjectForReview() {

        if (
            !currentProject ||
            pendingReviewerPicks.length === 0
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


        const phase =
            getPhase(
                currentProject.status
            );

        const firstAssignment = !currentProject.hasPreviousAssignment;


        console.log(
            "SENDING PROJECT FOR REVIEW:",
            {
                projectId: currentProject.id,
                staffIds: staffIds,
                phase: phase
            }
        );


        // =====================================================
        // FIRST ASSIGNMENT
        // =====================================================

        if (
            phase === "pending" && firstAssignment
        ) {

            await AdminApi.post(
                "/assignments",
                {
                    projectId:
                        currentProject.id,

                    staffIds:
                        staffIds
                }
            );


            return;
        }


        // =====================================================
        // RE-ASSIGN AFTER STUDENT REVISION
        // =====================================================

        if (            
            phase === "Pending" && !firstAssignment
        ) {

            if (
                typeof AdminApi.put !==
                "function"
            ) {

                throw new Error(
                    "AdminApi.put is not available. The reassignment endpoint must support PUT /assignments/:projectId."
                );
            }


            await AdminApi.put(
                `/assignments/${currentProject.id}`,
                {
                    staffIds:
                        staffIds
                }
            );


            return;
        }


        throw new Error(
            "Project cannot be sent for review in its current status."
        );
    }


    // =========================================================
    // SEND FINAL DECISION
    // =========================================================

    async function sendFinalDecision() {

        if (!currentProject) {

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


        // =====================================================
        // VALIDATE DECISION
        // =====================================================

        if (!decision) {

            throw new Error(
                "Please select a final decision before sending."
            );
        }


        // =====================================================
        // COMMENTS
        // =====================================================

        /*
         * For Accepted:
         * comments are optional.
         *
         * For Rejected / MinorRevision / MajorRevision:
         * comments are required.
         */

        if (
            decision !== "Accepted" &&
            !commentText
        ) {

            throw new Error(
                "Comments are required unless the decision is Accepted."
            );
        }


        console.log(
            "SENDING FINAL DECISION:",
            {
                projectId:
                    currentProject.id,

                decision:
                    decision,

                comments:
                    commentText
            }
        );


        // =====================================================
        // FINAL DECISION API
        // =====================================================

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

                if (!currentProject) {

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
                    phase === "pending"
                ) {

                    /*
                     * If admin opened Final Decision directly,
                     * send final decision.
                     */

                    if (
                        actionMode ===
                        "finalDecision"
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


                            actionMode =
                                null;


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


                    // ---------------------------------------------
                    // NORMAL FIRST REVIEW
                    // ---------------------------------------------

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
                            `This project has been sent to ${sentCount} reviewer(s). Its status is now "Under Review."`
                        );


                        if (
                            statusModal
                        ) {

                            statusModal.classList.remove(
                                "active"
                            );
                        }


                        actionMode =
                            null;


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
                     * IMPORTANT:
                     *
                     * Admin now has TWO independent choices:
                     *
                     * 1. Add Reviewer
                     * 2. Final Decision
                     *
                     * If reviewer was selected:
                     *      assign reviewer again.
                     *
                     * If Final Decision was opened:
                     *      send final decision directly.
                     */


                    if (
                        actionMode ===
                        "finalDecision"
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


                            actionMode =
                                null;


                        } catch (err) {

                            console.error(
                                "REVISION FINAL DECISION ERROR:",
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


                    // ---------------------------------------------
                    // RE-ASSIGN REVIEWER
                    // ---------------------------------------------

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


                            actionMode =
                                null;


                        } catch (err) {

                            console.error(
                                "REVISION RE-ASSIGNMENT ERROR:",
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


                        return;
                    }


                    /*
                     * This should normally not happen because
                     * Final Decision has its own button.
                     *
                     * But we keep this fallback so the old modal
                     * workflow still works.
                     */

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


                        actionMode =
                            null;


                    } catch (err) {

                        console.error(
                            "REVISION FALLBACK FINAL DECISION ERROR:",
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
                        "This project is currently under review by staff."
                    );


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


                        actionMode =
                            null;


                    } catch (err) {

                        console.error(
                            "UNDER DECISION FINAL DECISION ERROR:",
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
                // DONE
                // =================================================

                alert(
                    "This project has already received its final decision."
                );
            }
        );
    }


    // =========================================================
    // RESET MODAL WHEN OPENED
    // =========================================================

    if (
        statusModal
    ) {

        statusModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target !==
                    statusModal
                ) {

                    return;
                }


                statusModal.classList.remove(
                    "active"
                );


                actionMode =
                    null;


                pendingReviewerPicks =
                    [];
            }
        );
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadProject();

});
