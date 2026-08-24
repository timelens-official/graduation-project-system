(function () {

    "use strict";

    // =========================================================
    // INITIALIZE
    // =========================================================

    function initProjectDetails() {

        console.log("PROJECT DETAILS JS STARTED");


        // =====================================================
        // URL / PROJECT ID
        // =====================================================

        const params =
            new URLSearchParams(
                window.location.search
            );

        const projectId =
            params.get("id");


        console.log(
            "PROJECT ID:",
            projectId
        );


        // =====================================================
        // ELEMENTS
        // =====================================================

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


        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "STATUS MODAL:",
            statusModal
        );

        console.log(
            "STATUS BUTTON:",
            openModalBtn
        );

        console.log(
            "ADD REVIEWER BUTTON:",
            addReviewerBtn
        );

        console.log(
            "REVIEWER MODAL:",
            reviewerPickerModal
        );


        // =====================================================
        // STATE
        // =====================================================

        let currentProject = null;

        let teamMembers = [];

        let pendingReviewerPicks = [];

        let projectHasPreviousAssignment =
            false;


        // =====================================================
        // IMPORTANT:
        // OPEN STATUS MODAL
        // =====================================================

        if (openModalBtn) {

            openModalBtn.type =
                "button";


            openModalBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    console.log(
                        "PROJECT STATUS BUTTON CLICKED"
                    );


                    if (!statusModal) {

                        console.error(
                            "statusModal was not found."
                        );

                        return;
                    }


                    statusModal.classList.add(
                        "active"
                    );


                    /*
                     * Force visibility in case another CSS
                     * rule overrides the modal.
                     */

                    statusModal.style.opacity =
                        "1";

                    statusModal.style.visibility =
                        "visible";


                    console.log(
                        "STATUS MODAL OPENED"
                    );
                }
            );

        } else {

            console.error(
                "changeStatusBtn NOT FOUND"
            );
        }


        // =====================================================
        // CLOSE STATUS MODAL
        // =====================================================

        if (closeModalBtn) {

            closeModalBtn.type =
                "button";


            closeModalBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    closeStatusModal();
                }
            );
        }


        function closeStatusModal() {

            if (!statusModal) {
                return;
            }


            statusModal.classList.remove(
                "active"
            );


            statusModal.style.opacity =
                "";

            statusModal.style.visibility =
                "";
        }


        // =====================================================
        // ADD REVIEWER
        // =====================================================

        if (addReviewerBtn) {

            addReviewerBtn.type =
                "button";


            addReviewerBtn.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    console.log(
                        "ADD REVIEWER CLICKED"
                    );


                    if (!reviewerPickerModal) {

                        console.error(
                            "reviewerPickerModal was not found."
                        );

                        return;
                    }


                    pendingReviewerPicks =
                        [];


                    reviewerPickerModal.classList.add(
                        "active"
                    );


                    reviewerPickerModal.style.opacity =
                        "1";

                    reviewerPickerModal.style.visibility =
                        "visible";


                    /*
                     * Open modal FIRST.
                     *
                     * Loading staff must not prevent
                     * the modal from opening.
                     */

                    await renderDoctorsPicker();
                }
            );

        } else {

            console.warn(
                "addReviewerBtn not found yet."
            );
        }


        // =====================================================
        // CLOSE REVIEWER PICKER
        // =====================================================

        if (closePickerBtn) {

            closePickerBtn.type =
                "button";


            closePickerBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    closeReviewerPicker();
                }
            );
        }


        function closeReviewerPicker() {

            if (!reviewerPickerModal) {
                return;
            }


            reviewerPickerModal.classList.remove(
                "active"
            );


            reviewerPickerModal.style.opacity =
                "";

            reviewerPickerModal.style.visibility =
                "";
        }


        // =====================================================
        // CLICK OUTSIDE MODAL
        // =====================================================

        if (statusModal) {

            statusModal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        statusModal
                    ) {

                        closeStatusModal();
                    }
                }
            );
        }


        if (reviewerPickerModal) {

            reviewerPickerModal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        reviewerPickerModal
                    ) {

                        closeReviewerPicker();
                    }
                }
            );
        }


        // =====================================================
        // ESCAPE KEY
        // =====================================================

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;
                }


                closeStatusModal();

                closeReviewerPicker();
            }
        );


        // =====================================================
        // GET PROJECT PHASE
        // =====================================================

        function getPhase(
            status
        ) {

            if (
                status ===
                "Pending"
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


        // =====================================================
        // STATUS LABEL
        // =====================================================

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


        // =====================================================
        // ESCAPE HTML
        // =====================================================

        function escapeHtml(
            value
        ) {

            if (
                value ===
                undefined ||
                value ===
                null
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


        // =====================================================
        // DETECT PREVIOUS ASSIGNMENT
        // =====================================================

        function detectPreviousAssignment(
            project
        ) {

            if (!project) {

                return false;
            }


            if (
                project.hasPreviousAssignment ===
                true
            ) {

                return true;
            }


            if (
                project.has_previous_assignment ===
                true
            ) {

                return true;
            }


            if (
                project.hasPreviousAssignment ===
                1
            ) {

                return true;
            }


            if (
                project.hasPreviousAssignment ===
                "true"
            ) {

                return true;
            }


            if (
                Array.isArray(
                    project.assignments
                ) &&
                project.assignments.length >
                0
            ) {

                return true;
            }


            if (
                Array.isArray(
                    project.reviewers
                ) &&
                project.reviewers.length >
                0
            ) {

                return true;
            }


            if (
                Array.isArray(
                    project.reviews
                ) &&
                project.reviews.length >
                0
            ) {

                return true;
            }


            if (
                project.assignment &&
                typeof project.assignment ===
                "object"
            ) {

                return true;
            }


            if (
                project.previousAssignment &&
                typeof project.previousAssignment ===
                "object"
            ) {

                return true;
            }


            if (
                project.status ===
                "RevisionSubmitted"
            ) {

                return true;
            }


            return false;
        }


        // =====================================================
        // LOAD PROJECT
        // =====================================================

        async function loadProject() {

            /*
             * Don't let API errors break the buttons.
             */

            if (
                typeof AdminApi ===
                "undefined"
            ) {

                console.error(
                    "AdminApi is not loaded."
                );

                return;
            }


            if (!projectId) {

                console.error(
                    "Project ID is missing."
                );

                return;
            }


            try {

                currentProject =
                    await AdminApi.get(
                        `/projects/${projectId}`
                    );


                console.log(
                    "ADMIN PROJECT RESPONSE:",
                    currentProject
                );


                projectHasPreviousAssignment =
                    detectPreviousAssignment(
                        currentProject
                    );


                // =================================================
                // LOAD MEMBERS
                // =================================================

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


                    if (
                        !Array.isArray(
                            teamMembers
                        )
                    ) {

                        teamMembers = [];
                    }

                } catch (
                    membersError
                ) {

                    console.error(
                        "LOAD MEMBERS ERROR:",
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

                        teamMembers =
                            [];
                    }
                }


                renderProjectInfo();

                renderModalState();


            } catch (error) {

                console.error(
                    "LOAD PROJECT ERROR:",
                    error
                );
            }
        }


        // =====================================================
        // RENDER PROJECT INFO
        // =====================================================

        function renderProjectInfo() {

            if (!currentProject) {

                return;
            }


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
                    value !==
                    undefined &&
                    value !==
                    null &&
                    String(value).trim() !==
                    ""
                ) {

                    element.textContent =
                        value;

                } else {

                    element.textContent =
                        "—";
                }
            }


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


        // =====================================================
        // RENDER TEAM MEMBERS
        // =====================================================

        function renderTeamMembers() {

            const members =
                Array.isArray(
                    teamMembers
                )
                    ? teamMembers
                    : [];


            const normalized =
                members.map(
                    member => ({

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
                    })
                );


            function cells(
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
                normalized.find(
                    member =>
                        member.isLeader
                );


            const leaderBody =
                document.getElementById(
                    "leaderTableBody"
                );


            if (leaderBody) {

                leaderBody.innerHTML =
                    leader
                        ? `
                            <tr>
                                ${cells(
                                    leader
                                )}
                            </tr>
                          `
                        : `
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


            const membersBody =
                document.getElementById(
                    "membersTableBody"
                );


            if (membersBody) {

                membersBody.innerHTML =
                    normalized.length
                        ? normalized
                            .map(
                                member =>
                                    `
                                        <tr>
                                            ${cells(
                                                member
                                            )}
                                        </tr>
                                    `
                            )
                            .join("")
                        : `
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
        }        // =====================================================
        // RENDER STATUS BADGE
        // =====================================================

        function renderStatusBadge(
            status
        ) {

            if (
                projectStatusText
            ) {

                projectStatusText.textContent =
                    formatStatusLabel(
                        status
                    );
            }


            if (
                projectStatusBadge
            ) {

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
        }


        // =====================================================
        // RENDER REVIEWERS
        // =====================================================

        function renderReviewersList() {

            if (
                !reviewersList
            ) {

                return;
            }


            reviewersList.innerHTML =
                "";


            if (
                !currentProject
            ) {

                return;
            }


            const phase =
                getPhase(
                    currentProject.status
                );


            // -------------------------------------------------
            // SELECTED REVIEWERS
            // -------------------------------------------------

            if (
                phase ===
                "pending" ||
                phase ===
                "revisionSubmitted"
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
                                <span>
                                    <i
                                        class="fa-solid fa-user-doctor"
                                    ></i>

                                    ${escapeHtml(
                                        reviewer.full_name
                                    )}
                                </span>

                                <button
                                    type="button"
                                    class="btn-delete-reviewer"
                                >
                                    <i
                                        class="fa-solid fa-trash-can"
                                    ></i>
                                </button>
                            `;


                        const deleteBtn =
                            row.querySelector(
                                ".btn-delete-reviewer"
                            );


                        if (
                            deleteBtn
                        ) {

                            deleteBtn.addEventListener(
                                "click",
                                function (
                                    event
                                ) {

                                    event.preventDefault();

                                    event.stopPropagation();


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
                                                pendingReviewerPicks.length >
                                                0
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


            // -------------------------------------------------
            // SAVED REVIEWERS
            // -------------------------------------------------

            const reviewers =
                Array.isArray(
                    currentProject.reviewers
                )
                    ? currentProject.reviewers
                    : [];


            const reviews =
                Array.isArray(
                    currentProject.reviews
                )
                    ? currentProject.reviews
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


            // -------------------------------------------------
            // FALLBACK TO REVIEWS
            // -------------------------------------------------

            if (
                reviewers.length ===
                0 &&
                reviews.length >
                0
            ) {

                reviews.forEach(
                    review => {

                        const row =
                            document.createElement(
                                "div"
                            );


                        row.className =
                            "reviewer-item";


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
                                        review.decision ||
                                        "Pending Review"
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


        // =====================================================
        // COMMENTS
        // =====================================================

        function renderCommentsList() {

            if (
                !commentsList
            ) {

                return;
            }


            commentsList.innerHTML =
                "";


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


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "comment-card";


                    card.innerHTML =
                        `
                            <div
                                class="comment-header"
                            >
                                <span
                                    class="comment-author"
                                >
                                    ${escapeHtml(
                                        review.staff_name ||
                                        "Reviewer"
                                    )}
                                </span>
                            </div>

                            <div
                                class="comment-text"
                            >
                                ${escapeHtml(
                                    review.comments
                                )}
                            </div>
                        `;


                    commentsList.appendChild(
                        card
                    );


                    count++;
                }
            );


            if (
                currentProject.finalDecision &&
                currentProject.finalDecision.admin_comments
            ) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "comment-card";


                card.innerHTML =
                    `
                        <div
                            class="comment-header"
                        >
                            <span
                                class="comment-author"
                            >
                                Admin (Final Decision)
                            </span>
                        </div>

                        <div
                            class="comment-text"
                        >
                            ${escapeHtml(
                                currentProject
                                    .finalDecision
                                    .admin_comments
                            )}
                        </div>
                    `;


                commentsList.appendChild(
                    card
                );


                count++;
            }


            if (
                commentsCount
            ) {

                commentsCount.textContent =
                    `(${count})`;
            }
        }


        // =====================================================
        // MODAL STATE
        // =====================================================

        function renderModalState() {

            if (
                !currentProject
            ) {

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


            // -------------------------------------------------
            // FINAL DECISION
            // -------------------------------------------------

            if (
                finalDecisionRow
            ) {

                if (
                    phase ===
                    "pending" ||
                    phase ===
                    "underReview"
                ) {

                    finalDecisionRow.classList.add(
                        "hidden"
                    );

                } else {

                    finalDecisionRow.classList.remove(
                        "hidden"
                    );
                }
            }


            // -------------------------------------------------
            // ADD REVIEWER
            // -------------------------------------------------

            if (
                addReviewerBtn
            ) {

                if (
                    phase ===
                    "pending" ||
                    phase ===
                    "revisionSubmitted"
                ) {

                    addReviewerBtn.style.display =
                        "";

                } else {

                    addReviewerBtn.style.display =
                        "none";
                }
            }


            // -------------------------------------------------
            // PENDING
            // -------------------------------------------------

            if (
                phase ===
                "pending"
            ) {

                if (
                    modalPhaseHint
                ) {

                    modalPhaseHint.textContent =
                        "Add a reviewer, then click Send for Review.";
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


            // -------------------------------------------------
            // REVISION SUBMITTED
            // -------------------------------------------------

            else if (
                phase ===
                "revisionSubmitted"
            ) {

                if (
                    modalPhaseHint
                ) {

                    modalPhaseHint.textContent =
                        "The student submitted a revised project. You can assign a reviewer again or make the final decision directly.";
                }


                if (
                    confirmBtn
                ) {

                    confirmBtn.textContent =
                        pendingReviewerPicks.length >
                        0
                            ? "Send for Review"
                            : "Send Final Decision";

                    confirmBtn.style.display =
                        "";
                }
            }


            // -------------------------------------------------
            // UNDER REVIEW
            // -------------------------------------------------

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


            // -------------------------------------------------
            // UNDER DECISION
            // -------------------------------------------------

            else if (
                phase ===
                "underDecision"
            ) {

                if (
                    modalPhaseHint
                ) {

                    modalPhaseHint.textContent =
                        "Staff finished reviewing the project. Select a final decision and send it to the student.";
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


            // -------------------------------------------------
            // DONE
            // -------------------------------------------------

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
        }


        // =====================================================
        // LOAD STAFF
        // =====================================================

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

                    throw new Error(
                        "StaffStorage.getAll() is not available."
                    );
                }


            } catch (
                error
            ) {

                console.error(
                    "LOAD STAFF ERROR:",
                    error
                );


                doctorsPickerList.innerHTML =
                    `
                        <p class="doctors-picker-empty">
                            Could not load staff members.
                            <br>
                            ${escapeHtml(
                                error.message
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


                    item.addEventListener(
                        "click",
                        function (
                            event
                        ) {

                            event.preventDefault();

                            event.stopPropagation();


                            const exists =
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
                                exists
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


                            closeReviewerPicker();
                        }
                    );


                    doctorsPickerList.appendChild(
                        item
                    );
                }
            );
        }


        // =====================================================
        // SEND PROJECT FOR REVIEW
        // =====================================================

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


            const hasPrevious =
                projectHasPreviousAssignment ||
                detectPreviousAssignment(
                    currentProject
                );


            console.log(
                "HAS PREVIOUS ASSIGNMENT:",
                hasPrevious
            );


            // =================================================
            // REASSIGN
            // =================================================

            if (
                hasPrevious
            ) {

                if (
                    typeof AdminApi.put !==
                    "function"
                ) {

                    throw new Error(
                        "AdminApi.put is not available."
                    );
                }


                return await AdminApi.put(
                    `/assignments/projects/${currentProject.id}`,
                    {
                        staffIds:
                            staffIds
                    }
                );
            }


            // =================================================
            // FIRST ASSIGNMENT
            // =================================================

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


            projectHasPreviousAssignment =
                true;


            return response;
        }


        // =====================================================
        // SEND FINAL DECISION
        // =====================================================

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


            const comments =
                newCommentInput
                    ? newCommentInput.value.trim()
                    : "";


            if (
                !decision
            ) {

                throw new Error(
                    "Please select a final decision."
                );
            }


            if (
                decision !==
                "Accepted" &&
                !comments
            ) {

                throw new Error(
                    "Comments are required unless the decision is Accepted."
                );
            }


            return await AdminApi.post(
                "/reviews/final",
                {
                    projectId:
                        currentProject.id,

                    decision:
                        decision,

                    comments:
                        comments ||
                        undefined
                }
            );
        }


        // =====================================================
        // CONFIRM BUTTON
        // =====================================================

        if (
            confirmBtn
        ) {

            confirmBtn.type =
                "button";


            confirmBtn.addEventListener(
                "click",
                async function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();


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


                    confirmBtn.disabled =
                        true;


                    try {

                        // -----------------------------------------
                        // PENDING
                        // -----------------------------------------

                        if (
                            phase ===
                            "pending"
                        ) {

                            if (
                                pendingReviewerPicks.length ===
                                0
                            ) {

                                throw new Error(
                                    "Please add at least one reviewer before sending this project for review."
                                );
                            }


                            const count =
                                pendingReviewerPicks.length;


                            await sendProjectForReview();


                            await loadProject();


                            alert(
                                `This project has been sent to ${count} reviewer(s) for review.`
                            );


                            closeStatusModal();


                            return;
                        }


                        // -----------------------------------------
                        // REVISION SUBMITTED
                        // -----------------------------------------

                        if (
                            phase ===
                            "revisionSubmitted"
                        ) {

                            if (
                                pendingReviewerPicks.length >
                                0
                            ) {

                                const count =
                                    pendingReviewerPicks.length;


                                await sendProjectForReview();


                                await loadProject();


                                alert(
                                    `The revised project has been sent to ${count} reviewer(s) for review.`
                                );


                                closeStatusModal();


                            } else {

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


                                closeStatusModal();
                            }


                            return;
                        }


                        // -----------------------------------------
                        // UNDER DECISION
                        // -----------------------------------------

                        if (
                            phase ===
                            "underDecision"
                        ) {

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


                            closeStatusModal();


                            return;
                        }


                        // -----------------------------------------
                        // UNDER REVIEW
                        // -----------------------------------------

                        if (
                            phase ===
                            "underReview"
                        ) {

                            alert(
                                "This project is currently under review."
                            );


                            return;
                        }


                        // -----------------------------------------
                        // DONE
                        // -----------------------------------------

                        alert(
                            "This project has already received its final decision."
                        );


                    } catch (
                        error
                    ) {

                        console.error(
                            "WORKFLOW ERROR:",
                            error
                        );


                        alert(
                            error.message ||
                            "Something went wrong."
                        );


                    } finally {

                        confirmBtn.disabled =
                            false;
                    }
                }
            );
        }


        // =====================================================
        // INITIAL LOAD
        // =====================================================

        /*
         * IMPORTANT:
         *
         * The modals/buttons are already initialized above.
         * API loading is separate, so an API error can NEVER
         * prevent the buttons from opening the modals.
         */

        loadProject();

    }


    // =========================================================
    // START
    // =========================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initProjectDetails,
            {
                once: true
            }
        );

    } else {

        initProjectDetails();
    }

})();
