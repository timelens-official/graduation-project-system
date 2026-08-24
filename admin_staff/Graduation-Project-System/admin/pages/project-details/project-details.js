document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    const statusModal = document.getElementById("statusModal");
    const closeModalBtn = document.getElementById("closeModalBtn");

    const addReviewerActionBtn =
        document.getElementById("addReviewerActionBtn");

    const finalDecisionActionBtn =
        document.getElementById("finalDecisionActionBtn");

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

    const confirmReviewerSelectionBtn =
        document.getElementById("confirmReviewerSelectionBtn");

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


    let currentProject = null;
    let teamMembers = [];
    let pendingReviewerPicks = [];
    let actionMode = null;


    if (!projectId) {
        alert("No project selected.");

        window.location.href =
            "../projects/index.html";

        return;
    }


    async function loadProject() {

        try {

            currentProject =
                await AdminApi.get(
                    `/projects/${projectId}`
                );

            console.log(
                "ADMIN PROJECT RESPONSE:",
                currentProject
            );


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
            actionMode = null;

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

                    el.textContent = value;

                } else {

                    el.textContent = "—";
                }
            };


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


        if (status === "UnderReview") {

            projectStatusBadge.classList.add(
                "status-under-review"
            );
        }


        if (status === "UnderDecision") {

            projectStatusBadge.classList.add(
                "status-under-decision"
            );
        }
    }


    function renderActionButtons() {

        if (!currentProject) {
            return;
        }

        const phase =
            getPhase(
                currentProject.status
            );

        // Main page buttons:
        // Pending -> Add Reviewer only
        // UnderReview -> no action
        // UnderDecision -> Final Decision only
        // RevisionSubmitted -> Add Reviewer + Final Decision
        // Done -> no action

        if (addReviewerActionBtn) {

            addReviewerActionBtn.style.display =
                phase === "pending" ||
                phase === "revisionSubmitted"
                    ? ""
                    : "none";
        }

        if (finalDecisionActionBtn) {

            finalDecisionActionBtn.style.display =
                phase === "underDecision" ||
                phase === "revisionSubmitted"
                    ? ""
                    : "none";
        }
    }

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


                                updateReviewerPickerConfirmButton();
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


    function renderModalState() {

        if (!currentProject) {
            return;
        }

        const status = currentProject.status;
        const phase = getPhase(status);

        renderStatusBadge(status);
        renderActionButtons();
        renderReviewersList();
        renderCommentsList();

        // Final Decision is allowed ONLY after:
        // 1) reviewers finish -> UnderDecision
        // 2) student submits a revision -> RevisionSubmitted
        if (finalDecisionRow) {
            finalDecisionRow.classList.toggle(
                "hidden",
                phase !== "underDecision" &&
                phase !== "revisionSubmitted"
            );
        }

        // The Add Reviewer button INSIDE the modal is only for
        // reassignment after the student submits a revision.
        if (addReviewerBtn) {
            addReviewerBtn.style.display =
                phase === "revisionSubmitted" ? "" : "none";
        }

        // Pending = initial assignment only.
        if (phase === "pending") {

            if (modalPhaseHint) {
                modalPhaseHint.textContent =
                    "Select one or more reviewers, then assign the project for review.";
            }

            if (confirmBtn) {
                confirmBtn.style.display = "none";
            }

            return;
        }

        // RevisionSubmitted = exactly two choices:
        // Final Decision OR Add Reviewer/Reassign.
        if (phase === "revisionSubmitted") {

            if (modalPhaseHint) {
                modalPhaseHint.textContent =
                    actionMode === "finalDecision"
                        ? "The student submitted a revision. You can send the final decision directly."
                        : "The student submitted a revision. You can make the final decision or add reviewers again.";
            }

            if (confirmBtn) {
                if (actionMode === "finalDecision") {
                    confirmBtn.textContent = "Send Final Decision";
                    confirmBtn.style.display = "";
                } else {
                    confirmBtn.style.display = "none";
                }
            }

            return;
        }

        // UnderReview = no admin action.
        if (phase === "underReview") {

            if (modalPhaseHint) {
                modalPhaseHint.textContent =
                    "This project is currently under review by staff.";
            }

            if (confirmBtn) {
                confirmBtn.style.display = "none";
            }

            return;
        }

        // UnderDecision = Final Decision only.
        if (phase === "underDecision") {

            if (modalPhaseHint) {
                modalPhaseHint.textContent =
                    "Staff have finished reviewing this project. Select the final decision and send it to the student.";
            }

            if (confirmBtn) {
                confirmBtn.textContent = "Send Final Decision";
                confirmBtn.style.display = "";
            }

            return;
        }

        // Done = no actions.
        if (modalPhaseHint) {
            modalPhaseHint.textContent =
                `This project has already received its final decision: ${formatStatusLabel(status)}.`;
        }

        if (confirmBtn) {
            confirmBtn.style.display = "none";
        }
    }

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
                    phase !== "pending"
                ) {

                    alert(
                        "Initial reviewer assignment is only available while the project is pending."
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
                    phase !== "revisionSubmitted" &&
                    phase !== "underDecision"
                ) {

                    alert(
                        "Final Decision is only available after staff finish reviewing or after a student submits a revision."
                    );

                    return;
                }


                actionMode =
                    "finalDecision";

                pendingReviewerPicks = [];

                if (addReviewerBtn) {
                    addReviewerBtn.style.display = "none";
                }


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


    if (
        addReviewerBtn
    ) {

        addReviewerBtn.addEventListener(
            "click",
            function () {

                if (
                    !currentProject ||
                    currentProject.status !==
                    "RevisionSubmitted"
                ) {
                    return;
                }

                actionMode =
                    "reassignReviewer";

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


    async function renderDoctorsPicker() {

        if (!doctorsPickerList) {
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
                typeof StaffStorage !== "undefined" &&
                typeof StaffStorage.getAll === "function"
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
                        ${escapeHtml(err.message)}
                    </p>
                `;

            return;
        }

        if (!Array.isArray(doctors)) {
            doctors = [];
        }

        doctorsPickerList.innerHTML = "";

        const availableDoctors =
            doctors.filter(
                doctor => {

                    return !pendingReviewerPicks.some(
                        picked =>
                            String(picked.id) ===
                            String(doctor.id)
                    );
                }
            );

        if (availableDoctors.length === 0) {

            doctorsPickerList.innerHTML =
                `
                    <p class="doctors-picker-empty">
                        No registered staff members available.
                    </p>
                `;

            updateReviewerPickerConfirmButton();
            return;
        }

        availableDoctors.forEach(
            doctor => {

                const item =
                    document.createElement("div");

                item.className =
                    "doctor-pick-item";

                item.innerHTML =
                    `
                        <span>
                            <i class="fa-solid fa-user-doctor"></i>
                            ${escapeHtml(doctor.full_name)}
                        </span>

                        <i class="fa-solid fa-plus-circle"></i>
                    `;

                item.addEventListener(
                    "click",
                    function () {

                        const alreadySelected =
                            pendingReviewerPicks.some(
                                picked =>
                                    String(picked.id) ===
                                    String(doctor.id)
                            );

                        if (alreadySelected) {
                            return;
                        }

                        // Select only. The API is NOT called here.
                        pendingReviewerPicks.push({
                            id: doctor.id,
                            full_name: doctor.full_name
                        });

                        renderReviewersList();

                        // Keep the picker open for multi-select.
                        renderDoctorsPicker();
                    }
                );

                doctorsPickerList.appendChild(item);
            }
        );

        updateReviewerPickerConfirmButton();
    }


    function updateReviewerPickerConfirmButton() {

        if (!confirmReviewerSelectionBtn) {
            return;
        }

        const count =
            pendingReviewerPicks.length;

        confirmReviewerSelectionBtn.disabled =
            count === 0;

        if (count === 0) {

            confirmReviewerSelectionBtn.textContent =
                "Select Reviewers";

        } else {

            confirmReviewerSelectionBtn.textContent =
                actionMode === "reassignReviewer"
                    ? `Reassign ${count} Reviewer${count > 1 ? "s" : ""}`
                    : `Assign ${count} Reviewer${count > 1 ? "s" : ""}`;
        }
    }


    if (confirmReviewerSelectionBtn) {

        confirmReviewerSelectionBtn.addEventListener(
            "click",
            async function () {

                if (
                    !currentProject ||
                    pendingReviewerPicks.length === 0
                ) {

                    alert(
                        "Please select at least one reviewer."
                    );

                    return;
                }

                confirmReviewerSelectionBtn.disabled =
                    true;

                const wasReassign =
                    actionMode === "reassignReviewer";

                try {

                    const selectedCount =
                        pendingReviewerPicks.length;

                    await sendProjectForReview();

                    await loadProject();

                    alert(
                        wasReassign
                            ? `The revised project has been reassigned to ${selectedCount} reviewer(s).`
                            : `The project has been assigned to ${selectedCount} reviewer(s).`
                    );

                    if (reviewerPickerModal) {

                        reviewerPickerModal.classList.remove(
                            "active"
                        );
                    }

                    actionMode = null;
                    pendingReviewerPicks = [];

                    renderModalState();

                } catch (err) {

                    console.error(
                        "REVIEWER ASSIGNMENT ERROR:",
                        err
                    );

                    alert(
                        err.message ||
                        "Could not assign reviewers."
                    );

                } finally {

                    confirmReviewerSelectionBtn.disabled =
                        false;

                    updateReviewerPickerConfirmButton();
                }
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


        console.log(
            "SENDING PROJECT FOR REVIEW:",
            {
                projectId:
                    currentProject.id,

                staffIds:
                    staffIds,

                phase:
                    phase
            }
        );


        // =====================================================
        // FIRST ASSIGNMENT
        // =====================================================

        if (
            phase === "pending"
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
            phase === "revisionSubmitted"
        ) {

            if (
                typeof AdminApi.put !==
                "function"
            ) {

                throw new Error(
                    "AdminApi.put is not available."
                );
            }


            // IMPORTANT:
            // This is now exactly the same endpoint
            // used by Flutter.

            await AdminApi.put(
                `/assignments/projects/${currentProject.id}`,
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
                // Initial assignment only. Final Decision is forbidden.
                // =================================================

                if (
                    phase === "pending"
                ) {

                    alert(
                        "Please assign one or more reviewers using Add Reviewer."
                    );

                    return;
                }


                // =================================================
                // REVISION SUBMITTED
                // =================================================
                // Admin has two choices:
                // 1) Final Decision -> handled by this Confirm button
                // 2) Add Reviewer -> handled by the picker/reassign button
                // =================================================

                if (
                    phase === "revisionSubmitted"
                ) {

                    if (
                        actionMode !==
                        "finalDecision"
                    ) {

                        alert(
                            "Choose Final Decision or use Add Reviewer to reassign reviewers."
                        );

                        return;
                    }

                    confirmBtn.disabled = true;

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
                            statusModal.classList.remove("active");
                        }

                        actionMode = null;

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

                        confirmBtn.disabled = false;
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
