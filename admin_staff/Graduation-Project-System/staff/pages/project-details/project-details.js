document.addEventListener("DOMContentLoaded", async function () {

    // =========================================================
    // 1. GET PROJECT ID FROM URL
    // =========================================================

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");

    if (!projectId) {
        alert("No project selected.");
        window.location.href = "../dashboard/index.html";
        return;
    }


    // =========================================================
    // 2. LOAD PROJECT
    // =========================================================

    let project = null;

    try {

        project = await StaffApi.get(
            `/assignments/my-projects/${projectId}`
        );

        console.log(
            "STAFF PROJECT RESPONSE:",
            project
        );

    } catch (err) {

        console.error(
            "LOAD PROJECT ERROR:",
            err
        );

        alert(
            err.message ||
            "Project not found!"
        );

        window.location.href =
            "../dashboard/index.html";

        return;
    }


    // =========================================================
    // 3. PROJECT DATA
    // =========================================================

    const projectInfo =
        project.projectInformation || {};

    const teamInfo =
        project.teamInformation || {};


    // =========================================================
    // 4. STATUS FUNCTIONS
    // =========================================================

    function formatStatus(status) {

        const map = {

            Pending:
                "Pending",

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


    function getStatusBadgeClass(status) {

        switch (status) {

            case "Accepted":
                return "status-success";

            case "Rejected":
                return "status-error";

            case "MinorRevision":
            case "MajorRevision":
                return "status-warning";

            default:
                return "status-warning";
        }
    }


    // =========================================================
    // 5. ESCAPE HTML
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
    // 6. NORMALIZE MEMBER
    // =========================================================

    function normalizeMember(member) {

        if (!member) {
            return null;
        }

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


            // =================================================
            // PHONE
            // =================================================

            phone:
                member.member_phone ??
                member.memberPhone ??
                member.phone ??
                member.phone_number ??
                member.phoneNumber ??
                member.mobile ??
                member.mobile_number ??
                member.mobileNumber ??
                "—",


            // =================================================
            // ROLE
            // =================================================

            role:
                member.track_or_role ??
                member.trackOrRole ??
                member.role ??
                "—",


            // =================================================
            // STUDENT CODE
            // =================================================

            studentCode:
                member.student_code ??
                member.studentCode ??
                member.student_id ??
                member.studentId ??
                "—",


            // =================================================
            // LEADER
            // =================================================

            isLeader:

                member.is_leader === true ||
                member.is_leader === 1 ||
                member.is_leader === "1" ||
                member.is_leader === "true" ||

                member.isLeader === true ||
                member.isLeader === 1 ||
                member.isLeader === "1" ||
                member.isLeader === "true"
        };
    }


    // =========================================================
    // 7. RENDER PROJECT
    // =========================================================

    function renderProject() {


        // =====================================================
        // PROJECT TITLE
        // =====================================================

        const pTitle =
            document.getElementById(
                "pTitle"
            );

        if (pTitle) {

            pTitle.textContent =
                projectInfo.titleEn ||
                projectInfo.titleAr ||
                "—";
        }


        // =====================================================
        // DEPARTMENT
        // =====================================================

        const pDepartment =
            document.getElementById(
                "pDepartment"
            );

        if (pDepartment) {

            pDepartment.textContent =
                teamInfo.department ||
                projectInfo.department ||
                "—";
        }


        // =====================================================
        // PROGRAM
        // =====================================================

        const pProgram =
            document.getElementById(
                "pProgram"
            );

        if (pProgram) {

            pProgram.textContent =
                teamInfo.programName ||
                projectInfo.programName ||
                "—";
        }


        // =====================================================
        // ACADEMIC YEAR
        // =====================================================

        const pAcademicYear =
            document.getElementById(
                "pAcademicYear"
            );

        if (pAcademicYear) {

            pAcademicYear.textContent =
                projectInfo.academicYear ||
                "—";
        }


        // =====================================================
        // IDEA
        // =====================================================

        const pIdea =
            document.getElementById(
                "pIdea"
            );

        if (pIdea) {

            pIdea.textContent =
                projectInfo.idea ||
                "N/A";
        }


        // =====================================================
        // PROBLEM
        // =====================================================

        const pProblem =
            document.getElementById(
                "pProblem"
            );

        if (pProblem) {

            pProblem.textContent =
                projectInfo.problemDefinition ||
                "N/A";
        }


        // =====================================================
        // OBJECTIVES
        // =====================================================

        const pObjectives =
            document.getElementById(
                "pObjectives"
            );

        if (pObjectives) {

            pObjectives.textContent =
                projectInfo.objectives ||
                "N/A";
        }


        // =====================================================
        // CONTRIBUTION
        // =====================================================

        const pContribution =
            document.getElementById(
                "pContribution"
            );

        if (pContribution) {

            pContribution.textContent =
                projectInfo.expectedContribution ||
                "N/A";
        }


        // =====================================================
        // SUPERVISOR DOCTOR
        // =====================================================

        const supervisorDoctorEl =
            document.getElementById(
                "pSupervisorDoctor"
            );

        if (supervisorDoctorEl) {

            supervisorDoctorEl.textContent =
                teamInfo.supervisorDoctor ||
                "—";
        }


        // =====================================================
        // SUPERVISOR TA
        // =====================================================

        const supervisorTaEl =
            document.getElementById(
                "pSupervisorTa"
            );

        if (supervisorTaEl) {

            supervisorTaEl.textContent =
                teamInfo.supervisorTa ||
                "—";
        }


        // =====================================================
        // STATUS
        // =====================================================

        const statusEl =
            document.getElementById(
                "pStatus"
            );

        if (statusEl) {

            statusEl.textContent =
                formatStatus(
                    projectInfo.status
                );

            statusEl.className =
                "status-badge " +
                getStatusBadgeClass(
                    projectInfo.status
                );
        }


        // =====================================================
        // TEAM MEMBERS
        // =====================================================

        const rawMembers =
            Array.isArray(
                project.teamMembers
            )
                ? project.teamMembers
                : [];


        // =====================================================
        // NORMALIZE ALL MEMBERS
        // =====================================================

        const members =
            rawMembers
                .map(normalizeMember)
                .filter(Boolean);


        // =====================================================
        // FIND LEADER FROM TEAM MEMBERS
        // =====================================================
        //
        // IMPORTANT:
        // We intentionally find the leader from teamMembers
        // because the Admin page uses the same method.
        //
        // This ensures the leader's phone comes from the
        // exact same member object.
        // =====================================================

        let leader =
            members.find(
                member =>
                    member.isLeader === true
            );


        // =====================================================
        // FALLBACK TO teamLeader
        // =====================================================

        if (
            !leader &&
            project.teamLeader
        ) {

            leader =
                normalizeMember(
                    project.teamLeader
                );
        }


        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "RAW TEAM MEMBERS:",
            rawMembers
        );

        console.log(
            "NORMALIZED MEMBERS:",
            members
        );

        console.log(
            "FINAL LEADER:",
            leader
        );


        // =====================================================
        // LEADER TABLE
        // =====================================================

        const leaderTableBody =
            document.getElementById(
                "pLeaderTableBody"
            );


        if (leaderTableBody) {

            if (leader) {

                leaderTableBody.innerHTML = `

                    <tr>

                        <td>
                            ${escapeHtml(
                                leader.name
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                leader.phone
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                leader.role
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                leader.studentCode
                            )}
                        </td>

                    </tr>

                `;

            } else {

                leaderTableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="4"
                            style="
                                text-align:center;
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

        const membersTableBody =
            document.getElementById(
                "pMembersTableBody"
            );


        if (membersTableBody) {

            membersTableBody.innerHTML = "";


            if (
                members.length > 0
            ) {

                members.forEach(
                    member => {

                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${escapeHtml(
                                    member.name
                                )}
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


                        membersTableBody.appendChild(
                            row
                        );
                    }
                );

            } else {

                membersTableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="4"
                            style="
                                text-align:center;
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
    // 8. RENDER PROJECT
    // =========================================================

    renderProject();


    // =========================================================
    // 9. REVIEW MODAL ELEMENTS
    // =========================================================

    const modal =
        document.getElementById(
            "reviewModal"
        );


    const openBtn =
        document.getElementById(
            "openReviewModalBtn"
        );


    const closeBtn =
        document.getElementById(
            "closeModalBtn"
        );


    const cancelBtn =
        document.getElementById(
            "cancelModalBtn"
        );


    const reviewForm =
        document.getElementById(
            "reviewForm"
        );


    const submitBtn =
        reviewForm
            ? reviewForm.querySelector(
                'button[type="submit"]'
            )
            : null;


    // =========================================================
    // 10. REVIEW BUTTON STATUS
    // =========================================================

    if (
        projectInfo.status !==
        "UnderReview"
    ) {

        if (openBtn) {

            openBtn.disabled =
                true;

            openBtn.title =
                "This project isn't open for review right now.";
        }
    }


    // =========================================================
    // 11. OPEN MODAL
    // =========================================================

    if (openBtn) {

        openBtn.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.add(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // 12. CLOSE MODAL
    // =========================================================

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // 13. CANCEL MODAL
    // =========================================================

    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    // =========================================================
    // 14. CLICK OUTSIDE MODAL
    // =========================================================

    window.addEventListener(
        "click",
        function (e) {

            if (
                modal &&
                e.target === modal
            ) {

                modal.classList.remove(
                    "active"
                );
            }
        }
    );


    // =========================================================
    // 15. SUBMIT REVIEW
    // =========================================================

    if (reviewForm) {

        reviewForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                // =================================================
                // SELECTED STATUS
                // =================================================

                const selectedStatus =
                    document.querySelector(
                        'input[name="reviewStatus"]:checked'
                    )?.value;


                // =================================================
                // COMMENT
                // =================================================

                const doctorCommentInput =
                    document.getElementById(
                        "doctorComment"
                    );


                const doctorComment =
                    doctorCommentInput
                        ? doctorCommentInput.value.trim()
                        : "";


                // =================================================
                // VALIDATE STATUS
                // =================================================

                if (!selectedStatus) {

                    alert(
                        "Please select a status decision."
                    );

                    return;
                }


                // =================================================
                // VALIDATE COMMENT
                // =================================================

                if (!doctorComment) {

                    alert(
                        "Please enter a comment before submitting the report."
                    );


                    if (
                        doctorCommentInput
                    ) {

                        doctorCommentInput.focus();
                    }


                    return;
                }


                // =================================================
                // DISABLE SUBMIT
                // =================================================

                if (submitBtn) {

                    submitBtn.disabled =
                        true;
                }


                // =================================================
                // SUBMIT REVIEW
                // =================================================

                try {

                    await StaffApi.post(
                        "/reviews",
                        {
                            projectId:
                                projectInfo.id,

                            decision:
                                selectedStatus,

                            comments:
                                doctorComment
                        }
                    );


                    alert(
                        "Review submitted successfully!"
                    );


                    if (modal) {

                        modal.classList.remove(
                            "active"
                        );
                    }


                    window.location.reload();


                } catch (err) {

                    console.error(
                        "SUBMIT REVIEW ERROR:",
                        err
                    );


                    alert(
                        err.message ||
                        "Failed to submit review."
                    );


                } finally {

                    if (submitBtn) {

                        submitBtn.disabled =
                            false;
                    }
                }
            }
        );
    }

});
