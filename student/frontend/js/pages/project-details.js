/**
 * Project Details Page Logic!!
 */
(function () {
  function buildMemberRow(member) {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = member.name;
    if (member.isLeader) {
      const tag = document.createElement('span');
      tag.className = 'pd-member-leader-tag';
      tag.textContent = 'Leader';
      nameCell.append(' ', tag);
    }

    const roleCell = document.createElement('td');
    roleCell.textContent = member.role || '-';

    const phoneCell = document.createElement('td');
    phoneCell.className = 'member-phone-text';
    phoneCell.textContent = member.phone || '-';

    const codeCell = document.createElement('td');
    codeCell.textContent = member.studentCode || '-';

    tr.append(nameCell, roleCell, phoneCell, codeCell);
    return tr;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const token = await Storage.getToken();
    if (!token) { window.location.href = 'login.html'; return; }

    let project = null;
    try {
      project = await Api.getMyProject();
    } catch (err) {
      if (err.status !== 404) {
        Animations.showToast(err.message || 'Could not load your project.', 'error');
      }
      project = null;
    }

    if (!project) {
      document.getElementById('no-project').classList.remove('hidden');
      return;
    }

    let members = [];
    try {
      members = await Api.getMembers(project.id);
    } catch (err) {
      Animations.showToast(err.message || 'Could not load team members.', 'error');
      members = [];
    }

    const normalizedMembers = members.map((m) => ({
      name: m.member_name,
      phone: m.member_phone,
      role: m.track_or_role,
      studentCode: m.student_code,
      isLeader: m.is_leader
    }));

    document.getElementById('project-content').classList.remove('hidden');
    Animations.slideUp(document.getElementById('project-content'));

    // Populate team info
    document.getElementById('d-year').textContent = project.academic_year || '-';
    document.getElementById('d-dept').textContent = project.department || '-';
    document.getElementById('d-program').textContent = project.program_name || (project.program_id ? String(project.program_id) : '-');
    document.getElementById('d-supervisor').textContent = project.supervisor_doctor || '-';
    document.getElementById('d-assistant-supervisor').textContent = project.supervisor_ta || '-';

    // Populate project info
    document.getElementById('d-title-ar').textContent = project.title_ar || '-';
    document.getElementById('d-title-en').textContent = project.title_en || '-';
    document.getElementById('d-regulation').textContent = project.regulation || '-';
    App.applyStatusBadge(
      document.getElementById('project-status-badge'),
      document.getElementById('project-status-label'),
      project.status
    );
    document.getElementById('d-idea').textContent = project.idea || '-';
    document.getElementById('d-problem').textContent = project.problem_definition || '-';
    document.getElementById('d-objectives').textContent = project.objectives || '-';
    document.getElementById('d-contribution').textContent = project.expected_contribution || '-';

    // Populate team leader row
    const leaderRow = document.getElementById('d-leader-row');
    const leader = normalizedMembers.find((m) => m.isLeader);
    if (leader) {
      leaderRow.appendChild(buildMemberRow(leader));
    }

    // Populate team members table (leader is shown above in its own row,
    // and is also included here so the Team Members list reflects the
    // full team, consistent with the total team member count below).
    const membersList = document.getElementById('d-members-list');
    document.getElementById('d-members-count').textContent = normalizedMembers.length;
    normalizedMembers.forEach(m => membersList.appendChild(buildMemberRow(m)));
  });
})();
