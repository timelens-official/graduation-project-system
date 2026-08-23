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
  // 9. STATUS
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
  // 10. DOCTOR'S COMMENT
  //
  // The backend already returns:
  //
  // project.reviews = [
  //   {
  //     staff_name,
  //     comments,
  //     reviewed_at,
  //     decision
  //   }
  // ]
  //
  // We only display the latest review if it
  // actually contains a comment.
  // =========================================================

  const doctorReviewSection =
    document.getElementById(
      'doctor-review-section'
    );

  const doctorComment =
    document.getElementById(
      'doctor-comment'
    );

  const doctorReviewer =
    document.getElementById(
      'doctor-reviewer'
    );

  const doctorReviewDate =
    document.getElementById(
      'doctor-review-date'
    );


  // Make sure the section is hidden initially

  if (doctorReviewSection) {
    doctorReviewSection.classList.add('hidden');
  }


  // Get reviews safely

  const reviews =
    Array.isArray(project.reviews)
      ? project.reviews
      : [];


  // Get latest review

  const latestReview =
    reviews.length > 0
      ? reviews[reviews.length - 1]
      : null;


  // Check if there is an actual comment

  const comment =
    latestReview &&
    typeof latestReview.comments === 'string'
      ? latestReview.comments.trim()
      : '';


  // =========================================================
  // 11. SHOW COMMENT INSIDE SAME CARD
  // =========================================================

  if (comment) {

    // Show the review section
    if (doctorReviewSection) {
      doctorReviewSection.classList.remove('hidden');
    }


    // Doctor comment

    if (doctorComment) {

      doctorComment.textContent =
        comment;

    }


    // Doctor name

    if (doctorReviewer) {

      doctorReviewer.textContent =
        latestReview.staff_name ||
        '-';

    }


    // Review date

    if (
      doctorReviewDate &&
      latestReview.reviewed_at
    ) {

      doctorReviewDate.textContent =
        new Date(
          latestReview.reviewed_at
        ).toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }
        );

    }

  }


  // =========================================================
  // 12. EDIT PROJECT
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
