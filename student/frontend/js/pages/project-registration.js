/**
 * Project Registration / Edit Page Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);

  const token = await Storage.getToken();
  if (!token) { window.location.href = 'login.html'; return; }

  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.get('edit') === 'true';

  // The current academic year is determined and stored by the Backend
  // (GET /api/academic-years/current) — the Student dropdown must only
  // ever display that value, never a locally hardcoded/computed one, and
  // it is never sent back on POST /api/projects (the Backend sets it).
  let currentAcademicYear = null;
  try {
    const res = await Api.getCurrentAcademicYear();
    currentAcademicYear = res && res.academicYear;
  } catch (err) {
    Animations.showToast(err.message || 'Could not load the current academic year.', 'error');
  }

  // ---- Load existing project (if any) from the real Backend ----
  let existingProject = null;
  try {
    existingProject = await Api.getMyProject();
  } catch (err) {
    if (err.status !== 404) {
      Animations.showToast(err.message || 'Could not load your project.', 'error');
    }
    existingProject = null;
  }

  let projectId = existingProject ? existingProject.id : null;
  let existingMembers = [];
  let hasLeader = false;

  if (existingProject) {
    try {
      existingMembers = await Api.getMembers(existingProject.id);
    } catch (err) {
      Animations.showToast(err.message || 'Could not load team members.', 'error');
      existingMembers = [];
    }
    hasLeader = existingMembers.some((m) => m.is_leader);

    // Backend blocks edits once the project is Accepted / UnderReview /
    // UnderDecision — bounce to read-only details instead of a dead-end form.
    if (App.isEditBlockedStatus(existingProject.status)) {
      Animations.showToast('This project cannot be edited at its current review stage.', 'info');
      window.location.href = 'project-details.html';
      return;
    }

    // Fully-submitted project (has a leader) opened without ?edit=true:
    // go straight to details, same as before.
    if (hasLeader && !isEditMode) {
      Animations.showToast('You already have a registered project', 'info');
      setTimeout(() => window.location.href = 'project-details.html', 1500);
      return;
    }
    // Otherwise (hasLeader && isEditMode) → normal edit flow, or
    // (!hasLeader) → project exists but leader/members never finished
    // (e.g. a previous submit was interrupted); re-enter the wizard so the
    // student can complete it instead of being stuck.
  }

  if (existingProject) {
    $('page-title').textContent = 'Edit Graduation Project';
    $('page-subtitle').textContent = 'Update your graduation project information';
    $('topbar-title').textContent = 'Edit Project';

    const submitLabel = $('submit-btn-label');
    if (submitLabel) submitLabel.textContent = 'Save Changes';

    // Prefill step 1 (project info)
    $('proj-title-ar').value = existingProject.title_ar || '';
    $('proj-title-en').value = existingProject.title_en || '';
    $('proj-idea').value = existingProject.idea || '';
    $('proj-problem').value = existingProject.problem_definition || '';
    $('proj-objectives').value = existingProject.objectives || '';
    $('proj-contribution').value = existingProject.expected_contribution || '';

    // Prefill step 2 (team info)
    $('team-department').value = existingProject.department || '';
    $('team-regulation').value = existingProject.regulation || '';
    $('team-supervisor').value = existingProject.supervisor_doctor || '';
    $('team-assistant-supervisor').value = existingProject.supervisor_ta || '';
    // Program dropdown is preselected below (after real programs load)
    // using existingProject.program_id.
  }

  // Academic year is always server-computed and never sent by the
  // frontend — this just displays the real value returned by the Backend.
  // The dropdown intentionally exposes only this single (current) option,
  // so students cannot select a previous academic year.
  const academicYearSelect = $('team-academic-year');
  if (academicYearSelect && academicYearSelect.options.length) {
    const displayYear = (existingProject && existingProject.academic_year) || currentAcademicYear || '';
    academicYearSelect.options[0].value = displayYear;
    academicYearSelect.options[0].textContent = displayYear || 'Unavailable';
  }

  let currentStep = 1;

  // Unified in-memory shape for both API-loaded and locally-added members:
  // { id: <backend id or null>, name, phone, role, studentCode, isLeader }
  let members = existingMembers
    .filter((m) => !m.is_leader)
    .map((m) => ({
      id: m.id,
      name: m.member_name,
      phone: m.member_phone,
      role: m.track_or_role,
      studentCode: m.student_code,
      isLeader: false
    }));

  const existingLeaderRow = existingMembers.find((m) => m.is_leader);
  let leaderData = existingLeaderRow
    ? {
        id: existingLeaderRow.id,
        name: existingLeaderRow.member_name,
        phone: existingLeaderRow.member_phone,
        role: existingLeaderRow.track_or_role,
        studentCode: existingLeaderRow.student_code,
        isLeader: true
      }
    : null;

  // Backend-confirmed Department → departmentId mapping (official contract):
  //   1 → Computer Science (CS)
  //   2 → Information Systems (IS)
  const DEPARTMENT_ID_MAP = {
    'Computer Science': 1,
    'Information Systems': 2
  };

  // Programs are fetched live from the Backend via the official Student
  // endpoint (GET /api/programs/student?departmentId=<1|2>), scoped to the
  // selected Department. Option values are the real numeric program IDs
  // returned by the Backend — never invented locally.
  async function populateProgramOptions(department, selectedProgramId) {
    const programSelect = $('team-program');
    if (!programSelect) return;

    programSelect.innerHTML = '';

    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = 'Select program';
    programSelect.appendChild(placeholderOpt);

    const departmentId = DEPARTMENT_ID_MAP[department];
    if (!departmentId) {
      programSelect.disabled = true;
      return;
    }

    programSelect.disabled = true;
    let programs = [];
    try {
      programs = await Api.getPrograms(departmentId);
    } catch (err) {
      Animations.showToast(err.message || 'Could not load programs for this department.', 'error');
      programs = [];
    }

    programs.forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = p.name;
      programSelect.appendChild(opt);
    });

    programSelect.disabled = programs.length === 0;

    if (selectedProgramId && programs.some(p => String(p.id) === String(selectedProgramId))) {
      programSelect.value = String(selectedProgramId);
    } else {
      programSelect.value = '';
    }
  }

  // Registration Status (GET /api/settings/registration-status?departmentId=)
  // is checked against whichever department the student selects on this
  // form — it does NOT require the student's account to have a stored
  // department. If registration is closed for that department, block
  // continuing/creating the project and show the existing
  // "Project registration is closed." behavior.
  let isRegistrationOpenForSelectedDept = true;

  async function checkRegistrationStatus(department) {
    const banner = $('team-registration-closed-error');
    const departmentId = DEPARTMENT_ID_MAP[department];

    if (!departmentId) {
      isRegistrationOpenForSelectedDept = true;
      if (banner) banner.classList.remove('show');
      return;
    }

    try {
      const status = await Api.getRegistrationStatus(departmentId);
      isRegistrationOpenForSelectedDept = !!(status && status.is_registration_open);
    } catch (err) {
      // If the status can't be determined, don't block the student here —
      // the Backend enforces this again (and authoritatively) on submit.
      isRegistrationOpenForSelectedDept = true;
    }

    if (banner) {
      banner.classList.toggle('show', !isRegistrationOpenForSelectedDept);
    }
  }

  $('team-department').addEventListener('change', () => {
    populateProgramOptions($('team-department').value);
    Validation.clearField('team-program');
    checkRegistrationStatus($('team-department').value);
  });

  // If a department is already selected (e.g. edit mode prefill), check its
  // registration status right away.
  if ($('team-department').value) {
    await checkRegistrationStatus($('team-department').value);
  }

  // Initialize the program dropdown based on the current department.
  // In edit mode, preselect the project's existing program_id once the
  // real programs for that department have loaded.
  await populateProgramOptions(
    $('team-department').value,
    existingProject ? existingProject.program_id : ''
  );

  // Supervisor / Teaching Assistant names are entered in English and are NOT
  // student-name fields, so they do not require the 4-Arabic-names rule.
  Validation.restrictInput('team-supervisor', 'englishOnly');
  Validation.restrictInput('team-assistant-supervisor', 'englishOnly');
  Validation.attachLiveValidation('team-supervisor', ['required', 'englishOnly']);
  Validation.attachLiveValidation('team-assistant-supervisor', ['required', 'englishOnly']);

  // Student-name fields (Team Leader / Team Member) must be exactly 4 Arabic names.
  Validation.restrictInput('leader-name', 'arabicOnly');
  Validation.restrictInput('member-name', 'arabicOnly');
  Validation.attachLiveValidation('leader-name', ['required', 'arabicFullName']);
  Validation.attachLiveValidation('member-name', ['required', 'arabicFullName']);

  // Project name fields: prevent the wrong script from being typed at all,
  // then validate script + required on input/blur.
  Validation.restrictInput('proj-title-ar', 'arabicOnly');
  Validation.restrictInput('proj-title-en', 'englishOnly');
  Validation.attachLiveValidation('proj-title-ar', ['required', 'arabicOnly']);
  Validation.attachLiveValidation('proj-title-en', ['required', 'englishOnly']);

  // Expected Contribution is English and, like the other Project Information
  // fields, is required before moving to the next step.
  Validation.restrictInput('proj-contribution', 'englishOnly');
  Validation.attachLiveValidation('proj-contribution', ['required', 'englishOnly']);

  // Role / Specialization (Team Leader and Team Members) is English-only.
  Validation.restrictInput('leader-role', 'englishOnly');
  Validation.restrictInput('member-role', 'englishOnly');
  Validation.attachLiveValidation('leader-role', ['required', 'englishOnly']);
  Validation.attachLiveValidation('member-role', ['required', 'englishOnly']);

  // Project Idea, Problem Definition, and Objectives are English-only.
  Validation.restrictInput('proj-idea', 'englishOnly');
  Validation.restrictInput('proj-problem', 'englishOnly');
  Validation.restrictInput('proj-objectives', 'englishOnly');
  Validation.attachLiveValidation('proj-idea', ['required', 'englishOnly']);
  Validation.attachLiveValidation('proj-problem', ['required', 'englishOnly']);
  Validation.attachLiveValidation('proj-objectives', ['required', 'englishOnly']);

  // Student ID fields: digits only, at least 9.
  Validation.restrictInput('leader-code', 'digits');
  Validation.restrictInput('member-code', 'digits');
  Validation.attachLiveValidation('leader-code', ['required', 'facultyId']);
  Validation.attachLiveValidation('member-code', ['required', 'facultyId']);

  // Phone fields: digits only, must match Egyptian mobile format.
  Validation.restrictInput('leader-phone', 'digits');
  Validation.restrictInput('member-phone', 'digits');
  Validation.attachLiveValidation('leader-phone', ['required', 'phone']);
  Validation.attachLiveValidation('member-phone', ['required', 'phone']);

  // If the leader already exists on the backend, there's no endpoint to
  // update leader details (only create), so lock those fields but still
  // prefill them for context.
  if (leaderData && leaderData.id) {
    const leaderFieldMap = {
      'leader-name': 'name',
      'leader-phone': 'phone',
      'leader-role': 'role',
      'leader-code': 'studentCode'
    };
    Object.entries(leaderFieldMap).forEach(([fieldId, key]) => {
      const el = $(fieldId);
      if (!el) return;
      el.value = leaderData[key] || '';
      el.readOnly = true;
      el.title = 'The team leader cannot be changed once submitted.';
    });
  }

  function showStep(step) {
    document.querySelectorAll('[id^="step-"]').forEach(el => {
      if (el.id.match(/^step-\d+$/)) el.classList.add('hidden');
    });
    $('step-' + step).classList.remove('hidden');
    Animations.slideUp($('step-' + step));

    document.querySelectorAll('.step-tab').forEach(tab => {
      tab.classList.remove('active', 'completed');
      const s = parseInt(tab.dataset.step);
      if (s < step) tab.classList.add('completed');
      if (s === step) tab.classList.add('active');
    });

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep1() {
    let ok = true;

    const titleAr = $('proj-title-ar').value;
    const titleEn = $('proj-title-en').value;
    if (!Validation.validateField('proj-title-ar', titleAr, ['required', 'arabicOnly'])) ok = false;
    if (!Validation.validateField('proj-title-en', titleEn, ['required', 'englishOnly'])) ok = false;

    if (!Validation.validateField('proj-idea', $('proj-idea').value, ['required', 'englishOnly'])) ok = false;
    if (!Validation.validateField('proj-problem', $('proj-problem').value, ['required', 'englishOnly'])) ok = false;
    if (!Validation.validateField('proj-objectives', $('proj-objectives').value, ['required', 'englishOnly'])) ok = false;

    const contribution = $('proj-contribution').value;
    if (!Validation.validateField('proj-contribution', contribution, ['required', 'englishOnly'])) ok = false;

    return ok;
  }

  function validateStep2() {
    let ok = true;
    const year = $('team-academic-year').value;
    const dept = $('team-department').value;
    const program = $('team-program').value;
    const regulation = $('team-regulation').value;
    const supervisor = $('team-supervisor').value.trim();
    const assistant = $('team-assistant-supervisor').value.trim();

    if (!year) { Validation.showError('team-academic-year', 'This field is required'); ok = false; } else Validation.showSuccess('team-academic-year');
    if (!dept) { Validation.showError('team-department', 'This field is required'); ok = false; } else Validation.showSuccess('team-department');
    if (!program) { Validation.showError('team-program', 'This field is required'); ok = false; } else Validation.showSuccess('team-program');
    if (!regulation) { Validation.showError('team-regulation', 'This field is required'); ok = false; } else Validation.showSuccess('team-regulation');
    if (!Validation.validateField('team-supervisor', supervisor, ['required', 'englishOnly'])) ok = false;
    if (!Validation.validateField('team-assistant-supervisor', assistant, ['required', 'englishOnly'])) ok = false;

    if (dept && !isRegistrationOpenForSelectedDept) {
      $('team-registration-closed-error').classList.add('show');
      ok = false;
    }

    return ok;
  }

  function validateStep3() {
    if (leaderData && leaderData.id) return true; // already persisted, locked

    let ok = true;
    const name = $('leader-name').value.trim();
    const phone = $('leader-phone').value.trim();
    const role = $('leader-role').value.trim();
    const code = $('leader-code').value.trim();

    if (!Validation.validateField('leader-name', name, ['required', 'arabicFullName'])) ok = false;
    if (!Validation.validateField('leader-phone', phone, ['required', 'phone'])) ok = false;
    if (!Validation.validateField('leader-role', role, ['required', 'englishOnly'])) ok = false;
    if (!Validation.validateField('leader-code', code, ['required', 'facultyId'])) ok = false;

    if (ok && members.some((m) => normalizeStudentCode(m.studentCode) === normalizeStudentCode(code))) {
      Validation.showError('leader-code', 'This Student ID has already been added to the team');
      ok = false;
    }

    return ok;
  }

  // Student/Team Validation: a Student ID entered for one team member must
  // never be usable for another member, and the same person must never be
  // added twice — checked against the leader and every currently staged /
  // already-persisted member. Comparison ignores case/whitespace so visibly
  // identical IDs can't slip through as "different".
  function normalizeStudentCode(code) {
    return (code || '').trim().toLowerCase();
  }

  function findDuplicateStudentCode(code, { excludeIndex = -1 } = {}) {
    const normalized = normalizeStudentCode(code);
    if (!normalized) return false;

    if (leaderData && normalizeStudentCode(leaderData.studentCode) === normalized) {
      return true;
    }

    return members.some((m, i) => i !== excludeIndex && normalizeStudentCode(m.studentCode) === normalized);
  }

  function buildMemberCard(m, index) {
    const card = document.createElement('div');
    card.className = 'member-card';

    const info = document.createElement('div');
    info.className = 'member-card-info';

    const h4 = document.createElement('h4');
    h4.append(m.name);
    if (m.isLeader) {
      const tag = document.createElement('span');
      tag.className = 'badge badge-primary badge-tag-sm';
      tag.textContent = 'Leader';
      h4.append(' ', tag);
    }

    const roleP = document.createElement('p');
    roleP.textContent = m.role;

    const phoneP = document.createElement('p');
    phoneP.className = 'member-phone-text';
    phoneP.textContent = m.phone;

    const codeP = document.createElement('p');
    codeP.className = 'member-phone-text';
    codeP.textContent = m.studentCode || '';

    info.append(h4, roleP, phoneP, codeP);
    card.appendChild(info);

    if (!m.isLeader) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-icon-danger';
      delBtn.dataset.index = index;
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
      card.appendChild(delBtn);
    }

    return card;
  }

  function renderMembers() {
    const grid = $('members-grid');
    const countEl = $('members-count');
    grid.innerHTML = '';

    // Team Leader is part of the team members list/count, just like any
    // other member (internally still flagged via isLeader for role/UI
    // purposes, e.g. the "Leader" badge and no delete button).
    countEl.textContent = members.length + (leaderData ? 1 : 0);

    if (leaderData) {
      const leaderCard = buildMemberCard(leaderData, -1);
      grid.appendChild(leaderCard);
      Animations.slideUp(leaderCard, 250);
    }

    members.forEach((m, i) => {
      const card = buildMemberCard(m, i);
      grid.appendChild(card);
      Animations.slideUp(card, 250);
    });

    // Delete handlers
    grid.querySelectorAll('[data-index]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        const member = members[idx];

        if (member.id && projectId) {
          // Already persisted on the backend — delete for real.
          btn.disabled = true;
          try {
            await Api.deleteMember(projectId, member.id);
            members.splice(idx, 1);
            renderMembers();
            Animations.showToast('Member removed', 'success');
          } catch (err) {
            btn.disabled = false;
            Animations.showToast(err.message || 'Could not remove member.', 'error');
          }
        } else {
          // Not yet saved — just drop it locally.
          members.splice(idx, 1);
          renderMembers();
        }
      });
    });
  }

  // Step Navigation
  if (existingProject) {
    renderMembers();
  }

  $('next-step-1').addEventListener('click', () => {
    if (validateStep1()) showStep(2);
  });

  $('prev-step-2').addEventListener('click', () => showStep(1));

  $('next-step-2').addEventListener('click', async () => {
    const dept = $('team-department').value;
    if (dept) {
      const btn = $('next-step-2');
      Animations.setLoading(btn, true);
      await checkRegistrationStatus(dept);
      Animations.setLoading(btn, false);
    }
    if (validateStep2()) showStep(3);
  });

  $('prev-step-3').addEventListener('click', () => showStep(2));

  $('next-step-3').addEventListener('click', () => {
    if (validateStep3()) {
      if (!(leaderData && leaderData.id)) {
        leaderData = {
          id: null,
          name: $('leader-name').value.trim(),
          phone: $('leader-phone').value.trim(),
          role: $('leader-role').value.trim(),
          studentCode: $('leader-code').value.trim(),
          isLeader: true
        };
      }
      renderMembers();
      showStep(4);
    }
  });

  $('prev-step-4').addEventListener('click', () => showStep(3));

  // Add Member
  $('add-member-btn').addEventListener('click', async () => {
    const name = $('member-name').value.trim();
    const phone = $('member-phone').value.trim();
    const role = $('member-role').value.trim();
    const code = $('member-code').value.trim();

    let ok = true;
    if (!Validation.validateField('member-name', name, ['required', 'arabicFullName'])) ok = false;
    if (!Validation.validateField('member-phone', phone, ['required', 'phone'])) ok = false;
    if (!Validation.validateField('member-role', role, ['required', 'englishOnly'])) ok = false;
    if (!Validation.validateField('member-code', code, ['required', 'facultyId'])) ok = false;

    if (ok && findDuplicateStudentCode(code)) {
      Validation.showError('member-code', 'This Student ID has already been added to the team');
      ok = false;
    }

    if (!ok) return;

    const addBtn = $('add-member-btn');

    // If the project (and its leader) already exist on the backend, add
    // the member for real right away instead of only staging it locally.
    if (projectId && leaderData && leaderData.id) {
      Animations.setLoading(addBtn, true);
      try {
        const created = await Api.addMember(projectId, {
          memberName: name,
          memberPhone: phone,
          trackOrRole: role,
          studentCode: code
        });
        members.push({
          id: created.id,
          name: created.member_name,
          phone: created.member_phone,
          role: created.track_or_role,
          studentCode: created.student_code,
          isLeader: false
        });
        renderMembers();
        $('member-name').value = '';
        $('member-phone').value = '';
        $('member-role').value = '';
        $('member-code').value = '';
        Validation.clearAll($('member-name').closest('.card-body'));
        Animations.showToast('Member added successfully', 'success');
      } catch (err) {
        Animations.showToast(err.message || 'Could not add member.', 'error');
      } finally {
        Animations.setLoading(addBtn, false);
      }
      return;
    }

    // Otherwise (new project not yet submitted) — stage locally, sent on final submit.
    members.push({ id: null, name, phone, role, studentCode: code, isLeader: false });
    renderMembers();

    $('member-name').value = '';
    $('member-phone').value = '';
    $('member-role').value = '';
    $('member-code').value = '';
    Validation.clearAll($('member-name').closest('.card-body'));
    Animations.showToast('Member added successfully', 'success');
  });

  // Submit
  $('submit-btn').addEventListener('click', async () => {
    const nonLeaderMembers = members.filter(m => !m.isLeader);
    if (nonLeaderMembers.length < 1) {
      Validation.showError('members', 'You must add at least one member besides the leader');
      $('members-error').classList.add('show');
      return;
    }
    $('members-error').classList.remove('show');

    // Final safeguard: the same person/Student ID must never be submitted
    // twice, across the leader and every team member. Add-time checks
    // already prevent this in the normal flow, but this blocks submission
    // outright if duplicates are somehow present.
    const allCodes = [leaderData && leaderData.studentCode, ...members.map(m => m.studentCode)]
      .filter(Boolean)
      .map(normalizeStudentCode);
    const hasDuplicateCode = new Set(allCodes).size !== allCodes.length;
    if (hasDuplicateCode) {
      Animations.showToast('Duplicate Student ID detected among team members. Please remove duplicates before submitting.', 'error');
      $('members-error').classList.add('show');
      return;
    }

    const btn = $('submit-btn');
    Animations.setLoading(btn, true);

    try {
      let pid = projectId;

      const projectPayload = {
        titleAr: $('proj-title-ar').value.trim(),
        titleEn: $('proj-title-en').value.trim(),
        idea: $('proj-idea').value.trim(),
        problemDefinition: $('proj-problem').value.trim(),
        objectives: $('proj-objectives').value.trim(),
        expectedContribution: $('proj-contribution').value.trim(),
        supervisorDoctor: $('team-supervisor').value.trim(),
        supervisorTa: $('team-assistant-supervisor').value.trim(),
        department: $('team-department').value,
        programId: parseInt($('team-program').value, 10),
        regulation: $('team-regulation').value
      };

      if (!pid) {
        const created = await Api.createProject(projectPayload);
        pid = created.id;
        projectId = pid;
      } else if (isEditMode) {
        await Api.updateMyProject(pid, projectPayload);
      }

      // Leader: create only if not already persisted.
      if (!(leaderData && leaderData.id)) {
        const leaderRes = await Api.addLeader(pid, {
          memberName: leaderData.name,
          memberPhone: leaderData.phone,
          trackOrRole: leaderData.role,
          studentCode: leaderData.studentCode
        });
        leaderData.id = leaderRes.id;
      }

      // Members: only the ones not already persisted (unsaved local additions).
      const pendingMembers = members.filter(m => !m.isLeader && !m.id);
      for (const m of pendingMembers) {
        try {
          const res = await Api.addMember(pid, {
            memberName: m.name,
            memberPhone: m.phone,
            trackOrRole: m.role,
            studentCode: m.studentCode
          });
          m.id = res.id;
        } catch (memberErr) {
          Animations.showToast(`Could not add ${m.name}: ${memberErr.message}`, 'error');
        }
      }

      Animations.setLoading(btn, false);

      if (isEditMode) {
        Animations.showToast('Project updated successfully', 'success');
        setTimeout(() => window.location.href = 'project-details.html', 1000);
      } else {
        window.location.href = 'success.html';
      }
    } catch (err) {
      Animations.setLoading(btn, false);
      Animations.showToast(err.message || 'Something went wrong. Please try again.', 'error');
    }
  });
});
