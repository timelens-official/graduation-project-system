/**
 * Dashboard Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {

  // =========================================================
  // 1. AUTHENTICATION
  // =========================================================

  const user = await Storage.getToken();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }


  // =========================================================
  // 2. ELEMENTS
  // =========================================================

  const registerBtn =
    document.getElementById('register-project-btn');

  const editBtn =
    document.getElementById('edit-project-btn');


  // =========================================================
  // 3. LOAD PROJECT
  // =========================================================

  let project = null;

  try {

    project = await Api.getMyProject();

  } catch (err) {

    if (err.status !== 404) {

      Animations.showToast(
        err.message || 'Could not load your project.',
        'error'
      );

    }

    project = null;
  }


  // =========================================================
  // 4. NO PROJECT
  // =========================================================

  if (!project) {

    const noProjectSection =
      document.getElementById('no-project-section');

    if (noProjectSection) {

      noProjectSection.classList.remove('hidden');

      Animations.slideUp(noProjectSection);

    }

    if (editBtn) {
      editBtn.classList.add('hidden');
    }

    return;
  }


  // =========================================================
  // 5. HAS PROJECT
  // =========================================================

  const hasProjectSection =
    document.getElementById('has-project-section');

  if (hasProjectSection) {

    hasProjectSection.classList.remove('hidden');

    Animations.slideUp(hasProjectSection);

  }


  // =========================================================
  // 6. PROJECT TITLE
  // =========================================================

  const titleElement =
    document.getElementById('project-title-display');

  if (titleElement) {

    titleElement.textContent =
      project.title_en ||
      project.title_ar ||
      '-';

  }


  // =========================================================
  // 7. TEAM MEMBERS
  // =========================================================

  let memberCount = 0;

  try {

    const members =
      await Api.getMembers(project.id);

    memberCount =
      (members || []).length;

  } catch (err) {

    // Non-fatal
    memberCount = 0;

  }


  const membersElement =
    document.getElementById('project-members-display');

  if (membersElement) {

    membersElement.textContent =
      memberCount +
      (
        memberCount === 1
          ? ' member'
          : ' members'
      );

  }


  // =========================================================
  // 8. REGISTRATION DATE
  // =========================================================

  const dateElement =
    document.getElementById('project-date-display');

  if (dateElement) {

    const dateStr = project.created_at
      ? new Date(project.created_at)
        .toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }
        )
      : '-';

    dateElement.textContent = dateStr;

  }


  // =========================================================
  // 9. CURRENT PROJECT STATUS
  //
  // IMPORTANT:
  // project.status is ALWAYS the current status
  // of the current review cycle.
  //
  // Examples:
  // Pending
  // UnderReview
  // UnderDecision
  // Rejected
  // MinorRevision
  // MajorRevision
  // Accepted
  // =========================================================

  const statusBadge =
    document.getElementById(
      'project-status-badge'
    );

  const statusLabel =
    document.getElementById(
      'project-status-label'
    );

  if (statusBadge && statusLabel) {

    App.applyStatusBadge(
      statusBadge,
      statusLabel,
      project.status
    );

  }


  // =========================================================
  // 10. ADMIN FINAL COMMENT
  //
  // DO NOT use project.reviews here.
  //
  // project.reviews contains Staff reviews.
  //
  // The snapshot contains the LAST Admin final decision.
  // We only display its comment here.
  //
  // The Admin decision itself is represented by
  // project.status when it is the current final status.
  //
  // After the student resubmits:
  //
  // project.status = Pending
  //
  // while the previous Admin comment can remain visible
  // so the student knows what needs to be changed.
  // =========================================================

  const adminFinalSection =
    document.getElementById(
      'admin-final-decision-section'
    );

  const adminFinalComment =
    document.getElementById(
      'admin-final-comment'
    );


  // Hide initially

  if (adminFinalSection) {
    adminFinalSection.classList.add('hidden');
  }


  // =========================================================
  // 11. GET LAST ADMIN FINAL COMMENT
  // =========================================================

  const finalDecision =
    project.finalDecision || null;


  const finalCommentValue =
    finalDecision &&
      typeof finalDecision.admin_comments === 'string'
      ? finalDecision.admin_comments.trim()
      : '';


  // =========================================================
  // 12. SHOW ADMIN FINAL COMMENT
  // =========================================================

  if (finalCommentValue) {

    if (adminFinalSection) {
      adminFinalSection.classList.remove('hidden');
    }

    if (adminFinalComment) {
      adminFinalComment.textContent =
        finalCommentValue;
    }

  }


  // =========================================================
  // 13. EDIT PROJECT
  // =========================================================

  if (
    editBtn &&
    App.isEditBlockedStatus(project.status)
  ) {

    editBtn.classList.add(
      'form-disabled'
    );

    editBtn.setAttribute(
      'aria-disabled',
      'true'
    );

    editBtn.title =
      'This project cannot be edited at its current review stage.';


    editBtn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
      }
    );

  }

});
