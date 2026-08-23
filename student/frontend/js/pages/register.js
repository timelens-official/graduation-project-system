/**
 * Register Page Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (await Storage.getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  Validation.restrictInput('fullName', 'arabicOnly');
  Validation.restrictInput('facultyId', 'digits');
  Validation.restrictInput('nationalId', 'digits');
  Validation.attachLiveValidation('fullName', ['required', 'arabicFullName']);
  Validation.attachLiveValidation('facultyId', ['required', 'facultyId']);
  Validation.attachLiveValidation('nationalId', ['required', 'nationalId']);

  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertEl = document.getElementById('register-alert');
    const alertMsg = document.getElementById('register-alert-msg');
    const successEl = document.getElementById('register-success');
    alertEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const fullName = document.getElementById('fullName').value;
    const facultyId = document.getElementById('facultyId').value;
    const nationalId = document.getElementById('nationalId').value;

    let isValid = true;

    if (!Validation.validateField('fullName', fullName, ['required', 'arabicFullName'])) isValid = false;
    if (!Validation.validateField('facultyId', facultyId, ['required', 'facultyId'])) isValid = false;
    if (!Validation.validateField('nationalId', nationalId, ['required', 'nationalId'])) isValid = false;

    if (!isValid) return;

    const btn = document.getElementById('register-btn');
    Animations.setLoading(btn, true);

    try {
      // Backend registration endpoint (POST /api/auth/student/register) does
      // not return a token, only the created student row. Log the student
      // in immediately after so the UX still lands them on the dashboard.
      await Api.studentRegister({
        fullNameArabic: fullName.trim(),
        studentId: facultyId.trim(),
        nationalId: nationalId.trim()
      });

      const loginResult = await Api.studentLogin({
        studentId: facultyId.trim(),
        nationalId: nationalId.trim()
      });
      await Storage.setSession(loginResult.token, loginResult.student);

      Animations.setLoading(btn, false);
      successEl.classList.remove('hidden');
      form.classList.add('form-disabled');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (err) {
      Animations.setLoading(btn, false);

      // Duplicate Student ID / National ID (409) — surface under both
      // fields since the backend error doesn't say which one collided.
      if (err.status === 409) {
        Validation.showError('facultyId', err.message);
        Validation.showError('nationalId', err.message);
      } else if (Array.isArray(err.details) && err.details.length) {
        // Validation errors (400) — backend returns [{field, message}, ...]
        err.details.forEach((d) => {
          const fieldMap = { fullNameArabic: 'fullName', studentId: 'facultyId', nationalId: 'nationalId' };
          const fieldId = fieldMap[d.field] || d.field;
          Validation.showError(fieldId, d.message);
        });
      } else {
        alertMsg.textContent = err.message || 'Registration failed. Please try again.';
        alertEl.classList.remove('hidden');
        Animations.slideUp(alertEl);
      }
    }
  });
});
