/**
 * Validation Module
 */
const Validation = {
  rules: {
    required: (value) => value.trim().length > 0,
    // Accepts Arabic and Latin letters, spaces, hyphens and apostrophes between
    // name parts (so compound names like "عبد الرحمن محمد" or "Anne-Marie" are
    // valid). Rejects digits, punctuation, and leading/trailing separators.
    fullName: (value) => {
      const name = value.trim();
      if (name.length < 3) return false;
      return /^[A-Za-z\u0600-\u06FF]+(?:[\s'-]+[A-Za-z\u0600-\u06FF]+)*$/.test(name);
    },
    // Student ID must contain at least 9 digits everywhere it appears
    // (register, login demo data, team leader/member codes). No upper bound.
    facultyId: (value) => /^\d{9,}$/.test(value.trim()),
    // National ID must be exactly 14 digits.
    nationalId: (value) => /^\d{14}$/.test(value.trim()),
    // Must match the backend's Egyptian mobile validator exactly
    // (backend/src/validators/teamMembers.validator.js): 01[0,1,2,5]xxxxxxxx.
    phone: (value) => /^01[0125][0-9]{8}$/.test(value.trim()),
    minLength: (min) => (value) => value.trim().length >= min,
    maxLength: (max) => (value) => value.trim().length <= max,
    // Arabic letters, spaces, hyphens/apostrophes between words, and Arabic
    // punctuation/digits are rejected outright (Latin letters rejected too).
    arabicOnly: (value) => {
      const v = value.trim();
      if (!v) return false;
      return /^[\u0600-\u06FF]+(?:[\s'-]+[\u0600-\u06FF]+)*$/.test(v);
    },
    // Same as arabicOnly, but requires exactly four space-separated Arabic
    // name parts, e.g. "أحمد محمد علي حسن". Rejects 3 or fewer, and 5 or more.
    arabicFullName: (value) => {
      const v = value.trim();
      if (!v) return false;
      if (!/^[\u0600-\u06FF]+(?:[\s'-]+[\u0600-\u06FF]+)*$/.test(v)) return false;
      return v.split(/\s+/).filter(Boolean).length === 4;
    },
    // Latin letters, digits, spaces and common punctuation used in English
    // project names; Arabic characters are rejected outright.
    englishOnly: (value) => {
      const v = value.trim();
      if (!v) return false;
      return /^[A-Za-z0-9 .,'"()\-\/&:]+$/.test(v);
    },
  },

  messages: {
    required: 'This field is required',
    fullName: 'Please enter a valid name (Arabic or English letters only, at least 3 characters)',
    facultyId: 'Student ID must contain at least 9 digits',
    nationalId: 'National ID must be exactly 14 digits.',
    phone: 'Invalid phone number (must be a valid Egyptian mobile number, e.g. 010/011/012/015)',
    duplicateFacultyId: 'This student ID is already registered',
    duplicateNationalId: 'This national ID is already registered',
    invalidLogin: 'Incorrect student ID or password',
    minMembers: 'You must add at least one member to the team',
    arabicOnly: 'This field must contain Arabic characters only',
    arabicFullName: 'Name must contain exactly four Arabic names.',
    englishOnly: 'This field must contain English characters only',
    minLength: 'This field must be at least 8 characters',
  },

  showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + '-error');
    
    if (field) {
      field.classList.add('error');
      field.classList.remove('success');
    }
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }
  },

  showSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + '-error');
    
    if (field) {
      field.classList.remove('error');
      field.classList.add('success');
    }
    
    if (errorEl) {
      errorEl.classList.remove('show');
    }
  },

  clearField(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + '-error');
    
    if (field) {
      field.classList.remove('error', 'success');
    }
    
    if (errorEl) {
      errorEl.classList.remove('show');
    }
  },

  clearAll(form) {
    if (!form) return;
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
      input.classList.remove('error', 'success');
    });
    const errors = form.querySelectorAll('.form-error');
    errors.forEach(e => e.classList.remove('show'));
  },

  validateField(fieldId, value, rules) {
    for (const rule of rules) {
      if (typeof rule === 'string') {
        if (!this.rules[rule](value)) {
          this.showError(fieldId, this.messages[rule]);
          return false;
        }
      } else if (typeof rule === 'object') {
        const { type, param, message } = rule;
        const ruleFn = this.rules[type](param);
        if (!ruleFn(value)) {
          this.showError(fieldId, message || this.messages[type]);
          return false;
        }
      }
    }
    this.showSuccess(fieldId);
    return true;
  },

  // Strips disallowed characters as the person types, so an Arabic-only field
  // can never end up holding Latin letters (and vice versa), and numeric
  // fields can never hold non-digit characters. This runs in addition to
  // (not instead of) validateField/attachLiveValidation, which still checks
  // length/format rules and shows the error message.
  restrictInput(fieldId, type) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const filters = {
      arabicOnly: (v) => v.replace(/[^\u0600-\u06FF\s'-]/g, ''),
      englishOnly: (v) => v.replace(/[^A-Za-z0-9 .,'"()\-\/&:]/g, ''),
      arabicEnglish: (v) => v.replace(/[^A-Za-z\u0600-\u06FF\s'-]/g, ''),
      digits: (v) => v.replace(/[^0-9]/g, ''),
    };
    const filterFn = filters[type];
    if (!filterFn) return;

    field.addEventListener('input', () => {
      const filtered = filterFn(field.value);
      if (filtered !== field.value) {
        const pos = field.selectionStart - (field.value.length - filtered.length);
        field.value = filtered;
        if (field.setSelectionRange) field.setSelectionRange(pos, pos);
      }
    });
  },

  attachLiveValidation(fieldId, rules) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.addEventListener('input', () => {
      if (field.value.trim()) {
        this.validateField(fieldId, field.value, rules);
      } else {
        this.clearField(fieldId);
      }
    });

    field.addEventListener('blur', () => {
      this.validateField(fieldId, field.value, rules);
    });
  }
};