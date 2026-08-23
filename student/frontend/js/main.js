/**
 * Main Application Module
 */
const App = {
  async init() {
    this.setupSidebar();
    this.setupNavigation();
    this.setupLogoutModal();
    await this.checkAuth();
  },

  // Shared status badge renderer used by dashboard + project details.
  // Real backend statuses (see backend/src/utils/constants.js +
  // backend/src/services/projects.service.js):
  //   Pending, UnderReview, UnderDecision, Accepted,
  //   Rejected, MinorRevision, MajorRevision
  applyStatusBadge(badgeEl, labelEl, status) {
    if (!badgeEl || !labelEl) return;
    const resolvedStatus = status || 'Pending';

    const STATUS_LABELS = {
      Pending: 'Pending Review',
      UnderReview: 'Under Review',
      UnderDecision: 'Under Decision',
      Accepted: 'Accepted',
      Rejected: 'Rejected',
      MinorRevision: 'Minor Revision Required',
      MajorRevision: 'Major Revision Required'
    };

    labelEl.textContent = STATUS_LABELS[resolvedStatus] || resolvedStatus;
    badgeEl.classList.remove('badge-warning', 'badge-success', 'badge-danger', 'badge-primary');

    if (resolvedStatus === 'Accepted') {
      badgeEl.classList.add('badge-success');
    } else if (resolvedStatus === 'Rejected' || resolvedStatus === 'MajorRevision') {
      badgeEl.classList.add('badge-danger');
    } else if (resolvedStatus === 'UnderReview' || resolvedStatus === 'UnderDecision') {
      badgeEl.classList.add('badge-primary');
    } else {
      // Pending, MinorRevision
      badgeEl.classList.add('badge-warning');
    }
  },

  // Statuses where the backend blocks editing
  // (backend/src/services/projects.service.js updateMyProject)
  isEditBlockedStatus(status) {
    return status === 'Accepted' || status === 'UnderReview' || status === 'UnderDecision';
  },

  async checkAuth() {
    const token = await Storage.getToken();
    const page = window.location.pathname;
    const publicPages = ['login.html', 'register.html'];
    const isPublic = publicPages.some(p => page.includes(p));

    if (!token && !isPublic) {
      window.location.href = 'login.html';
      return;
    }

    if (token && isPublic) {
      window.location.href = 'dashboard.html';
      return;
    }

    if (token) {
      const user = await Storage.getCurrentUser();
      if (user) this.populateUserInfo(user);
    }
  },

  populateUserInfo(user) {
    const nameEls = document.querySelectorAll('.user-name');
    const idEls = document.querySelectorAll('.user-faculty-id');

    nameEls.forEach(el => el.textContent = user.arabic_name || '');
    idEls.forEach(el => el.textContent = user.student_id || '');
  },

  setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger');

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }
  },

  setupNavigation() {
    // Highlight active nav item
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item[data-page]');

    navItems.forEach(item => {
      const page = item.dataset.page;
      if (currentPath.includes(page)) {
        item.classList.add('active');
      }
    });

    // Logout
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', () => this.logout());
    });
  },

  setupLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (!modal) return;

    document.getElementById('confirm-logout')?.addEventListener('click', async () => {
      await Storage.clearSession();
      window.location.href = 'login.html';
    });

    document.getElementById('cancel-logout')?.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  },

  async logout() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
      modal.classList.add('show');
    } else {
      await Storage.clearSession();
      window.location.href = 'login.html';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
