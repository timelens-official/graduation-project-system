document.addEventListener("DOMContentLoaded", function () {
    const staffForm = document.getElementById("addStaffForm");
    const programForm = document.getElementById("addProgramForm");

    // Password show/hide toggle on the Add Staff form
    const togglePasswordBtn = document.getElementById("toggleStaffPassword");
    const staffPasswordInput = document.getElementById("staffPassword");
    if (togglePasswordBtn && staffPasswordInput) {
        togglePasswordBtn.addEventListener("click", function () {
            const showing = staffPasswordInput.type === "password";
            staffPasswordInput.type = showing ? "text" : "password";
            const icon = togglePasswordBtn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye", !showing);
                icon.classList.toggle("fa-eye-slash", showing);
            }
        });
    }

    // 0️⃣ دالة إظهار الـ Toast Popup Notification فوق
    function showToast(message, isSuccess = false) {
        let toast = document.getElementById("toastNotification");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toastNotification";
            toast.className = "toast-popup";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast-popup active ${isSuccess ? 'success' : 'error'}`;

        setTimeout(() => {
            toast.className = 'toast-popup';
        }, 3000);
    }

    // 1️⃣ إدارة أعضاء هيئة التدريس — backed by the real backend (/api/staff),
    //    scoped to the signed-in admin's department. Adding a member here
    //    persists them to the database, so the same list automatically feeds
    //    the "Select Reviewer" picker on the Project Details page.

    function createStaffRow(member) {
        const row = document.createElement("tr");
        row.dataset.staffId = member.id;

        row.innerHTML = `
            <td>${member.full_name}</td>
            <td><div class="table-actions"></div></td>
        `;

        attachActionEvents(row, {
            onDelete: () => StaffStorage.remove(member.id),
            onEdit: (newName) => StaffStorage.update(member.id, newName)
        });

        return row;
    }

    async function renderStaff() {
        const staffTableBody = document.getElementById("staffTableBody");
        if (!staffTableBody || typeof StaffStorage === "undefined") return;

        try {
            const staff = await StaffStorage.getAll();
            staffTableBody.innerHTML = "";
            staff.forEach((member) => {
                staffTableBody.appendChild(createStaffRow(member));
            });
        } catch (err) {
            showToast(`⚠️ Could not load staff: ${err.message}`);
        }
    }

    renderStaff();

    if (staffForm) {
        staffForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const nameInput = document.getElementById("staffFullName");
            const userInput = document.getElementById("staffUsername");
            const passInput = document.getElementById("staffPassword");

            const fullName = nameInput ? nameInput.value.trim() : "";
            const username = userInput ? userInput.value.trim() : "";
            const password = passInput ? passInput.value.trim() : "";

            if (!fullName || !username || !password) {
                showToast("⚠️ Please fill in all fields!");
                return;
            }

            if (password.length < 6) {
                showToast("⚠️ Password must be at least 6 characters.");
                return;
            }
            const nameRegex = /^[A-Za-z0-9 ]+$/;
            if (!nameRegex.test(fullName)) {
                showToast("⚠️ Full Name must contain only English letters, numbers, and spaces");
                return;
            }
            const usernameRegex = /^[A-Za-z0-9@._-]+$/;
            if (!usernameRegex.test(username)) {
                    showToast("⚠️ Username must contain only English letters, numbers, and @ . _ -");
                    return;
            }

                // التحقق من Password (ممنوع العربية والمسافات)
            const passwordRegex = /^[A-Za-z0-9@#$%^&+=!]+$/;
            if (!passwordRegex.test(password)) {
                    showToast("⚠️ Password must contain only English letters, numbers, and special characters (@ # $ % ^ & + = !)");
                    return;
            }
            const submitBtn = staffForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            try {
                const newStaff = await StaffStorage.add(fullName, username, password);
                const staffTableBody = document.getElementById("staffTableBody");
                if (staffTableBody) {
                    staffTableBody.appendChild(createStaffRow(newStaff));
                }

                staffForm.reset();
                showToast(`✅ ${fullName} added successfully!`, true);
            } catch (err) {
                showToast(`❌ ${err.message}`);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // 2️⃣ Programs Management — backed by the real backend (/api/programs),
    //    scoped to the signed-in admin's department (plus shared programs
    //    like Artificial Intelligence). The first row is always the
    //    backend's "All CS/IS Programs" placeholder (id === ""), which
    //    can't be renamed or deleted.

    function createProgramRow(program) {
        const row = document.createElement("tr");
        row.dataset.programId = program.id;

        const isPlaceholder = program.id === "" || program.id === null || program.id === undefined;

        row.innerHTML = `
            <td>${program.name}</td>
            <td><div class="table-actions"></div></td>
        `;

        if (!isPlaceholder) {
            attachActionEvents(row, {
                onDelete: () => ProgramsStorage.remove(program.id),
                onEdit: (newName) => ProgramsStorage.update(program.id, newName)
            });
        }

        return row;
    }

    async function renderPrograms() {
        const programsTableBody = document.getElementById("programsTableBody");
        if (!programsTableBody || typeof ProgramsStorage === "undefined") return;

        try {
            const programs = await ProgramsStorage.getAll();
            programsTableBody.innerHTML = "";
            programs.forEach((program) => {
                programsTableBody.appendChild(createProgramRow(program));
            });
        } catch (err) {
            showToast(`⚠️ Could not load programs: ${err.message}`);
        }
    }

    renderPrograms();

    if (programForm) {
        programForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const programInput = programForm.querySelector('input[type="text"]');
            const programName = programInput ? programInput.value.trim() : "";

            if (!programName) {
                showToast("⚠️ Please enter a program name!");
                return;
            }

            const submitBtn = programForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            try {
                const newProgram = await ProgramsStorage.add(programName);
                const programsTableBody = document.getElementById("programsTableBody");
                if (programsTableBody) {
                    programsTableBody.appendChild(createProgramRow(newProgram));
                }

                programForm.reset();
                showToast(`✅ Program "${programName}" added successfully!`, true);
            } catch (err) {
                showToast(`❌ ${err.message}`);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // 3️⃣ تفعيل أزرار الحذف والتعديل — async now, calls the real API.
    //    Editing happens inline (an input right in the table row) instead
    //    of a native prompt() dialog — prompt()/alert()/confirm() are
    //    silently blocked in a lot of embedded/sandboxed preview contexts,
    //    which made the Edit button look completely dead with no error.
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function renderViewActions(row, options) {
        const actionsCell = row.querySelector(".table-actions");
        actionsCell.innerHTML = `
            <button type="button" class="btn-action-edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn-action-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        `;

        actionsCell.querySelector(".btn-action-delete").addEventListener("click", async () => {
            if (!confirm("Are you sure you want to delete this item?")) return;
            try {
                if (typeof options.onDelete === "function") {
                    await options.onDelete();
                }
                row.remove();
                showToast("🗑️ Item deleted successfully.", true);
            } catch (err) {
                showToast(`❌ ${err.message}`);
            }
        });

        actionsCell.querySelector(".btn-action-edit").addEventListener("click", () => {
            const nameCell = row.querySelector("td:first-child");
            enterEditMode(row, nameCell.textContent.trim(), options);
        });
    }

    function enterEditMode(row, currentValue, options) {
        const nameCell = row.querySelector("td:first-child");
        const actionsCell = row.querySelector(".table-actions");

        nameCell.innerHTML = `<input type="text" class="inline-edit-input" value="${escapeHtml(currentValue)}">`;
        const input = nameCell.querySelector("input");
        input.focus();
        input.select();

        actionsCell.innerHTML = `
            <button type="button" class="btn-action-save" title="Save"><i class="fa-solid fa-check"></i></button>
            <button type="button" class="btn-action-cancel" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
        `;

        const saveBtn = actionsCell.querySelector(".btn-action-save");
        const cancelBtn = actionsCell.querySelector(".btn-action-cancel");

        function exitEditMode(displayValue) {
            nameCell.textContent = displayValue;
            renderViewActions(row, options);
        }

        cancelBtn.addEventListener("click", () => exitEditMode(currentValue));

        async function save() {
            const newValue = input.value.trim();

            if (!newValue) {
                showToast("⚠️ Name can't be empty.");
                input.focus();
                return;
            }

            if (newValue === currentValue) {
                exitEditMode(currentValue);
                return;
            }

            saveBtn.disabled = true;
            try {
                if (typeof options.onEdit === "function") {
                    await options.onEdit(newValue);
                }
                exitEditMode(newValue);
                showToast("✏️ Updated successfully!", true);
            } catch (err) {
                showToast(`❌ ${err.message}`);
                exitEditMode(currentValue);
            }
        }

        saveBtn.addEventListener("click", save);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") exitEditMode(currentValue);
        });
    }

    function attachActionEvents(row, options = {}) {
        renderViewActions(row, options);
    }
});
