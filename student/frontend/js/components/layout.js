/**
 * Shared App Shell (Sidebar + Topbar)
 *
 * Every authenticated page includes a single placeholder:
 *   <div id="app-shell" data-topbar-title="Page Title"></div>
 *   <script src="../js/components/layout.js"></script>
 *
 * This script renders the sidebar and topbar markup once and injects it
 * in place of the placeholder, so the sidebar/topbar HTML lives in one
 * place instead of being duplicated on every page. It runs synchronously
 * during page parse (before DOMContentLoaded), so main.js can safely
 * query `.sidebar`, `.topbar`, `.nav-item`, etc. once the DOM is ready.
 */
(function () {
  function sidebarHTML() {
    return `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10 12 5 2 10l10 5 10-5z"/>
            <path d="M6 12.5V17c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5"/>
            <path d="M22 10v6"/>
          </svg>
        </div>
        <div class="sidebar-logo-text">
          Registration
          <span>Graduation Projects</span>
        </div>
      </div>
      <div class="sidebar-divider"></div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        <a href="dashboard.html" class="nav-item" data-page="dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </a>
        <a href="developers.html" class="nav-item" data-page="developers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          About Developers
        </a>
        <button class="nav-item logout-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </nav>

      <div class="sidebar-illustration">
        <img src="../assets/images/logo.png" alt="" loading="lazy">
      </div>
    </aside>`;
  }

  function topbarHTML() {
    return `
    <header class="topbar" id="topbar">
      <button class="hamburger" id="hamburger" aria-label="Toggle menu" type="button">
        <span></span><span></span><span></span>
      </button>
      <span class="topbar-title" id="topbar-title"></span>
      <div class="topbar-spacer"></div>
    </header>`;
  }

  function mount() {
    const placeholder = document.getElementById('app-shell');
    if (!placeholder) return;
    const title = placeholder.dataset.topbarTitle || '';
    placeholder.outerHTML = sidebarHTML() + topbarHTML();
    // Set as text (not interpolated markup) so the title can never be
    // parsed as HTML.
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = title;
  }

  mount();
})();
