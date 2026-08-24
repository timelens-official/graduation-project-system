document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    // =========================================================
    // ELEMENTS
    // =========================================================

    const statusModal = document.getElementById("statusModal");
    const openModalBtn = document.getElementById("changeStatusBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    const addReviewerBtn = document.getElementById("addReviewerBtn");
    const reviewersList = document.getElementById("reviewersList");

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


    // =========================================================
    // PROJECT ID CHECK
    // =========================================================

    if (!projectId) {

        alert("No project selected.");

        window.location.href = "../projects/index.html";

        return;
    }


    // =========================================================
    // LOAD PROJECT
    // =========================================================

    async function loadProject() {

        try {

            // -------------------------------------------------
            // 1. GET PROJECT DATA
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
            // 2. GET TEAM MEMBERS SEPARATELY
            // -------------------------------------------------

            try {

                if (
                    typeof AdminApi.getMembers === "function"
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


            pendingReviewerPicks = [];


            // -------------------------------------------------
            // RENDER EVERYTHING
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
    // RENDER PROJECT INFORMATION
    // =========================================================

    function renderProjectInfo() {

        // =====================================================
        // SAFE TEXT FUNCTION
        // =====================================================

        const setText = (id, value) => {

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

                el.textContent = value;

            } else {

                el.textContent = "—";
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


        // -----------------------------------------------------
        // Normalize members
        // -----------------------------------------------------

        const normalizedMembers =
            teamMembers.map((member) => {

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
            });


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
                                ? `<span class="member-leader-tag">
                                    Leader
                                   </span>`
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
                    `<tr>
                        ${buildMemberCells(leader)}
                    </tr>`;

            } else {

                leaderBody.innerHTML = `
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

            if (normalizedMembers.length > 0) {

                membersBody.innerHTML =
                    normalizedMembers
                        .map(
                            member =>
                                `<tr>
                                    ${buildMemberCells(member)}
                                </tr>`
                        )
                        .join("");

            } else {

                membersBody.innerHTML = `
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
    // PROJECT WORKFLOW
    // =========================================================

    function getPhase(status) {

        if (status === "Pending") {
            return "pending";
        }

        if (status === "RevisionSubmitted") {
            return "revisionSubmitted";
        }

        if (status === "UnderReview") {
            return "underReview";
        }

        if (status === "UnderDecision") {
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
    // REVIEWERS
    // =========================================================

    function renderReviewersList() {

        if (!reviewersList) {
            return;
        }


        reviewersList.innerHTML = "";


        const phase =
            getPhase(
                currentProject.status
            );


        // =====================================================
        // PENDING / REVISION SUBMITTED
        // =====================================================

        if (
            phase === "pending" ||
            phase === "revisionSubmitted"
        ) {

            pendingReviewerPicks.forEach(
                (reviewer) => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "reviewer-item";


                    row.innerHTML = `
                        <button
                            type="button"
                            class="btn-delete-reviewer"
                            title="Remove reviewer"
                        >
                            <i class="fa-solid fa-trash-can"></i>
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
                            () => {

                                pendingReviewerPicks =
                                    pendingReviewerPicks.filter(
                                        p =>
                                            p.id !==
                                            reviewer.id
                                    );


                                renderReviewersList();


                                // Update button after removing reviewer
                                if (
                                    currentProject &&
                                    currentProject.status ===
                                    "RevisionSubmitted"
                                ) {

                                    if (confirmBtn) {

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


        // =====================================================
        // AFTER PROJECT WAS SENT
        // =====================================================

        const reviews =
            currentProject.reviews || [];


        const reviewers =
            currentProject.reviewers || [];


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
            (reviewer) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "reviewer-item";


                const review =
                    reviews.find(
                        r =>
                            String(
                                r.staff_id
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


                row.innerHTML = `
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
        // FALLBACK
        // =====================================================

        if (
            reviewers.length === 0 &&
            reviews.length > 0
        ) {

            reviews.forEach(
                (review) => {

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


                    row.innerHTML = `
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


        card.innerHTML = `
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


        (
            currentProject.reviews || []
        ).forEach(
            (review) => {

                if (!review.comments) {
                    return;
                }


                addCommentCardDOM(
                    review.staff_name,
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

        const status =
            currentProject.status;


        const phase =
            getPhase(status);


        renderStatusBadge(status);

        renderReviewersList();

        renderCommentsList();


        // =====================================================
        // FINAL DECISION VISIBILITY
        // =====================================================

        if (finalDecisionRow) {

            /*
             * Final Decision is:
             *
             * 1. Hidden on first Pending submission
             * 2. Hidden while UnderReview
             * 3. Visible on UnderDecision
             * 4. Visible on RevisionSubmitted
             *
             * This is exactly the requested workflow.
             */

            finalDecisionRow.classList.toggle(
                "hidden",
                phase === "pending" ||
                phase === "underReview"
            );
        }


        // =====================================================
        // ADD REVIEWER VISIBILITY
        // =====================================================

        if (addReviewerBtn) {

            /*
             * Admin can add reviewers:
             *
             * - First time: Pending
             * - After student revision: RevisionSubmitted
             *
             * But NOT while the project is already under review.
             */

            addReviewerBtn.style.display =
                (
                    phase === "pending" ||
                    phase === "revisionSubmitted"
                )
                    ? ""
                    : "none";
        }


        // =====================================================
        // CLEAR COMMENT
        // =====================================================

        if (newCommentInput) {

            newCommentInput.value = "";
        }


        // =====================================================
        // PENDING
        // =====================================================

        if (phase === "pending") {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    'Add reviewers below, then click "Send for Review" to send this project to staff.';
            }


            if (confirmBtn) {

                confirmBtn.textContent =
                    "Send for Review";

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
                    "The student has submitted a revised project. You can either make a final decision directly or add a reviewer to review the new version.";
            }


            if (confirmBtn) {

                /*
                 * UI LOGIC:
                 *
                 * No reviewer selected:
                 *      Send Final Decision
                 *
                 * Reviewer selected:
                 *      Send for Review
                 */

                confirmBtn.textContent =
                    pendingReviewerPicks.length > 0
                        ? "Send for Review"
                        : "Send Final Decision";

                confirmBtn.style.display =
                    "";
            }


            /*
             * Don't force a decision here.
             * Admin can choose one from the dropdown.
             */
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
                    'Staff have finished reviewing this project. Select a final decision below, then click "Send Final Decision".';
            }


            if (confirmBtn) {

                confirmBtn.textContent =
                    "Send Final Decision";

                confirmBtn.style.display =
                    "";
            }


            if (finalDecisionSelect) {

                finalDecisionSelect.value =
                    "";
            }
        }


        // =====================================================
        // DONE
        // =====================================================

        else {

            if (modalPhaseHint) {

                modalPhaseHint.textContent =
                    `This project's final decision ("${formatStatusLabel(
                        status
                    )}") has already been sent to the student.`;
            }


            if (confirmBtn) {

                confirmBtn.style.display =
                    "none";
            }


            if (finalDecisionSelect) {

                finalDecisionSelect.value =
                    (
                        currentProject.finalDecision &&
                        currentProject.finalDecision.admin_decision
                    ) ||
                    status;
            }
        }
    }


    // =========================================================
    // OPEN STATUS MODAL
    // =========================================================

    if (openModalBtn) {

        openModalBtn.addEventListener(
            "click",
            () => {

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

    if (closeModalBtn) {

        closeModalBtn.addEventListener(
            "click",
            () => {

                if (statusModal) {

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

    if (addReviewerBtn) {

        addReviewerBtn.addEventListener(
            "click",
            function () {

                renderDoctorsPicker();


                if (reviewerPickerModal) {

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

    if (closePickerBtn) {

        closePickerBtn.addEventListener(
            "click",
            () => {

                if (reviewerPickerModal) {

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
                event.target === statusModal
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
    // LOAD STAFF MEMBERS
    // =========================================================

    async function renderDoctorsPicker() {

        if (!doctorsPickerList) {
            return;
        }


        doctorsPickerList.innerHTML = `
            <p class="doctors-picker-empty">
                Loading staff members...
            </p>
        `;


        let doctors = [];


        try {

            doctors =
                typeof StaffStorage !== "undefined"
                    ? await StaffStorage.getAll()
                    : [];

        } catch (err) {

            doctorsPickerList.innerHTML = `
                <p class="doctors-picker-empty">
                    Could not load staff members:
                    ${escapeHtml(err.message)}
                </p>
            `;

            return;
        }


        doctorsPickerList.innerHTML = "";


        const availableDoctors =
            doctors.filter(
                doctor =>
                    !pendingReviewerPicks.some(
                        picked =>
                            picked.id ===
                            doctor.id
                    )
            );


        if (
            availableDoctors.length === 0
        ) {

            doctorsPickerList.innerHTML = `
                <p class="doctors-picker-empty">
                    No more registered staff members to add.
                    Add one from the Staff and Programs page.
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


                item.innerHTML = `
                    <span>
                        <i class="fa-solid fa-user-doctor"></i>
                        ${escapeHtml(
                            doctor.full_name
                        )}
                    </span>

                    <i class="fa-solid fa-plus-circle"></i>
                `;


                item.addEventListener(
                    "click",
                    function () {

                        /*
                         * Don't add duplicate reviewer
                         */

                        const alreadySelected =
                            pendingReviewerPicks.some(
                                picked =>
                                    String(picked.id) ===
                                    String(doctor.id)
                            );


                        if (alreadySelected) {

                            return;
                        }


                        pendingReviewerPicks.push({
                            id: doctor.id,
                            full_name:
                                doctor.full_name
                        });


                        renderReviewersList();


                        /*
                         * IMPORTANT:
                         *
                         * RevisionSubmitted + reviewer selected
                         * => Send for Review
                         *
                         * RevisionSubmitted + no reviewer
                         * => Send Final Decision
                         */

                        if (
                            currentProject &&
                            currentProject.status ===
                            "RevisionSubmitted"
                        ) {

                            if (confirmBtn) {

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


        // =====================================================
        // FIRST TIME ASSIGNMENT
        // =====================================================

        if (phase === "pending") {

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
            phase === "revisionSubmitted"
        ) {

            if (
                typeof AdminApi.put !== "function"
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

        const decision =
            finalDecisionSelect
                ? finalDecisionSelect.value
                : "";


        const commentText =
            newCommentInput
                ? newCommentInput.value.trim()
                : "";


        if (!decision) {

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

    if (confirmBtn) {

        confirmBtn.addEventListener(
            "click",
            async function () {

                const phase =
                    getPhase(
                        currentProject.status
                    );


                // =================================================
                // FIRST TIME
                // Pending
                // =================================================

                if (
                    phase === "pending"
                ) {

                    if (
                        pendingReviewerPicks.length === 0
                    ) {

                        alert(
                            "Please add at least one reviewer before sending this project for review."
                        );

                        return;
                    }


                    confirmBtn.disabled =
                        true;


                    try {

                        await sendProjectForReview();


                        const sentCount =
                            pendingReviewerPicks.length;


                        await loadProject();


                        alert(
                            `This project has been sent to ${sentCount} reviewer(s). Its status is now "Under Review."`
                        );


                        if (statusModal) {

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
                    phase === "revisionSubmitted"
                ) {

                    /*
                     * THIS IS THE IMPORTANT UI LOGIC.
                     *
                     * Reviewer selected:
                     *      -> Assign Reviewer
                     *
                     * No Reviewer selected:
                     *      -> Final Decision
                     */

                    if (
                        pendingReviewerPicks.length > 0
                    ) {

                        confirmBtn.disabled =
                            true;


                        try {

                            await sendProjectForReview();


                            const sentCount =
                                pendingReviewerPicks.length;


                            await loadProject();


                            alert(
                                `The revised project has been sent to ${sentCount} reviewer(s) for review.`
                            );


                            if (statusModal) {

                                statusModal.classList.remove(
                                    "active"
                                );
                            }


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


                    } else {

                        /*
                         * No reviewer selected:
                         *
                         * Admin chose to make the Final Decision
                         * directly after seeing the student's revision.
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


                            if (statusModal) {

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
                    phase === "underDecision"
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


                        if (statusModal) {

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
                    phase === "underReview"
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
