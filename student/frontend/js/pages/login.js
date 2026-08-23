/**
 * Login Page Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (await Storage.getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Toggle password visibility
  const EYE_OPEN = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_CROSSED = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eye-icon');

  toggleBtn?.addEventListener('click', () => {
    const showing = passwordInput.type === 'password';
    passwordInput.type = showing ? 'text' : 'password';
    eyeIcon.innerHTML = showing ? EYE_CROSSED : EYE_OPEN; // static markup, no user input
  });

  const facultyIdInput = document.getElementById('facultyId');
  const getSelectedRole = () => document.querySelector('input[name="userRole"]:checked')?.value || 'student';

  // Username/ID field: digits-only for Student (unchanged original behavior),
  // letters+numbers+underscore (max 20) for Admin/Staff.
  facultyIdInput.addEventListener('input', () => {
    const role = getSelectedRole();
    const filtered = role === 'student'
      ? facultyIdInput.value.replace(/[^0-9]/g, '')
      : facultyIdInput.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
    if (filtered !== facultyIdInput.value) {
      const pos = facultyIdInput.selectionStart - (facultyIdInput.value.length - filtered.length);
      facultyIdInput.value = filtered;
      if (facultyIdInput.setSelectionRange) facultyIdInput.setSelectionRange(pos, pos);
    }
  });

  // Password field: digits-only (National ID) for Student (unchanged original
  // behavior). Admin/Staff passwords are not digit-restricted.
  passwordInput.addEventListener('input', () => {
    if (getSelectedRole() === 'student') {
      const filtered = passwordInput.value.replace(/[^0-9]/g, '');
      if (filtered !== passwordInput.value) passwordInput.value = filtered;
    }
  });

  const facultyIdRules = () => ['required'];
  const passwordRules = () => (getSelectedRole() === 'student' ? ['required', 'nationalId'] : ['required']);

  facultyIdInput.addEventListener('input', () => {
    if (facultyIdInput.value.trim()) Validation.validateField('facultyId', facultyIdInput.value, facultyIdRules());
    else Validation.clearField('facultyId');
  });
  facultyIdInput.addEventListener('blur', () => Validation.validateField('facultyId', facultyIdInput.value, facultyIdRules()));

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.trim()) Validation.validateField('password', passwordInput.value, passwordRules());
    else Validation.clearField('password');
  });
  passwordInput.addEventListener('blur', () => Validation.validateField('password', passwordInput.value, passwordRules()));

  // Placeholders/limits swap with the selected role; Student values match the
  // page's original hard-coded markup exactly.
  const updateFieldsForRole = () => {
    const role = getSelectedRole();
    Validation.clearField('facultyId');
    Validation.clearField('password');
    if (role === 'student') {
      facultyIdInput.placeholder = 'Enter your student ID';
      passwordInput.placeholder = 'National ID (14 digits)';
      passwordInput.maxLength = 14;
    } else {
      facultyIdInput.placeholder = 'Enter username';
      passwordInput.placeholder = 'Enter password';
      passwordInput.removeAttribute('maxlength');
    }
  };

  // Only students can self-register, so hide the "Create a new account" link
  // whenever Doctor/Staff is selected.
  const createAccountLink = document.getElementById('create-account-link');
  const roleInputs = document.querySelectorAll('input[name="userRole"]');
  const syncCreateAccountLink = () => {
    const selectedRole = document.querySelector('input[name="userRole"]:checked')?.value || 'student';
    createAccountLink?.classList.toggle('hidden', selectedRole !== 'student');
  };
  roleInputs.forEach((input) => input.addEventListener('change', () => {
    syncCreateAccountLink();
    updateFieldsForRole();
  }));

  // This page is the central login for Student, Admin, and Staff. The
  // standalone Admin/Staff login pages redirect here with ?role=admin or
  // ?role=staff so the right tab is preselected instead of defaulting to
  // Student every time.
  const requestedRole = new URLSearchParams(window.location.search).get('role');
  if (requestedRole === 'admin' || requestedRole === 'staff') {
    const roleInput = document.getElementById('role-' + requestedRole);
    if (roleInput) roleInput.checked = true;
  }

  syncCreateAccountLink();
  updateFieldsForRole();

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertEl = document.getElementById('login-alert');
    const alertMsg = document.getElementById('login-alert-msg');
    alertEl.classList.add('hidden');

    const selectedRole = document.querySelector('input[name="userRole"]:checked')?.value || 'student';

    // Admin/Staff: authenticate against the existing real backend endpoints
    // and hand off to the existing Admin/Staff dashboards, using the exact
    // localStorage keys their apps already read (admin/shared/js/api.js and
    // staff/shared/js/api.js), so those dashboards see an already-logged-in
    // session instead of a separate/fake one.
    if (selectedRole === 'admin' || selectedRole === 'staff') {
      const username = facultyIdInput.value.trim();
      const password = passwordInput.value.trim();

      let isValid = true;
      if (!Validation.validateField('facultyId', username, ['required'])) isValid = false;
      if (!Validation.validateField('password', password, ['required'])) isValid = false;
      if (!isValid) return;

      const btn = document.getElementById('login-btn');
      Animations.setLoading(btn, true);

      try {
        if (selectedRole === 'admin') {
          const result = await Api.adminLogin({ username, password });
          // Build (and validate) the redirect BEFORE showing success/
          // navigating anywhere, so a bad config fails loudly on THIS page
          // with a clear message instead of navigating to a broken URL.
          const redirectUrl = AppConfig.buildCrossOriginRedirect(
            AppConfig.ADMIN_DASHBOARD_URL,
            result.token,
            result.admin
          );
          Animations.showToast('Welcome! You have logged in successfully', 'success');
          await new Promise((r) => setTimeout(r, 500));
          // The Admin app is a SEPARATE origin (its own host:port), so this
          // page's localStorage write is invisible to it — writing
          // admin_token/admin_user here would silently do nothing useful.
          // Instead hand the token/user off via one-time URL params; the
          // Admin app's own api.js reads them on load, stores them under
          // its own origin's admin_token/admin_user keys, then scrubs the
          // URL. See admin/shared/js/api.js (consumeLoginHandoff).
          window.location.href = redirectUrl;
        } else {
          const result = await Api.staffLogin({ username, password });
          const redirectUrl = AppConfig.buildCrossOriginRedirect(
            AppConfig.STAFF_DASHBOARD_URL,
            result.token,
            result.staff
          );
          Animations.showToast('Welcome! You have logged in successfully', 'success');
          await new Promise((r) => setTimeout(r, 500));
          window.location.href = redirectUrl;
        }
      } catch (err) {
        Animations.setLoading(btn, false);
        facultyIdInput.classList.add('error');
        passwordInput.classList.add('error');
        alertMsg.textContent = err.message || 'Invalid username or password.';
        alertEl.classList.remove('hidden');
        Animations.slideUp(alertEl);
      }
      return;
    }

    const facultyId = document.getElementById('facultyId').value.trim();
    const password = document.getElementById('password').value.trim();

    let isValid = true;
    if (!Validation.validateField('facultyId', facultyId, ['required'])) isValid = false;
    if (!Validation.validateField('password', password, ['required', 'nationalId'])) isValid = false;
    if (!isValid) return;

    const btn = document.getElementById('login-btn');
    Animations.setLoading(btn, true);

    try {
      const result = await Api.studentLogin({ studentId: facultyId, nationalId: password });
      await Storage.setSession(result.token, result.student);

      Animations.showToast('Welcome ' + (result.student.arabic_name || '') + '! You have logged in successfully', 'success');

      await new Promise((r) => setTimeout(r, 500));
      window.location.href = 'dashboard.html';
    } catch (err) {
      Animations.setLoading(btn, false);

      document.getElementById('facultyId').classList.add('error');
      document.getElementById('password').classList.add('error');

      alertMsg.textContent = err.message || 'Incorrect student ID or password';
      alertEl.classList.remove('hidden');
      Animations.slideUp(alertEl);
    }
  });
});
