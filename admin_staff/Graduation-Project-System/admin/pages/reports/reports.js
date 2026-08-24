// ============================================================================
// Reports page
// ----------------------------------------------------------------------------
// The Excel and PDF files are generated entirely by the backend.
// This page only sends the selected filters to the backend and downloads
// the generated report.
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    populateFilters();

    const excelBtn = document.getElementById("btnGenerateExcel");
    const pdfBtn = document.getElementById("btnGeneratePdf");

    if (excelBtn) {
        excelBtn.addEventListener("click", () => downloadReport("excel"));
    } else {
        console.error("Excel button with ID 'btnGenerateExcel' was not found!");
    }

    if (pdfBtn) {
        pdfBtn.addEventListener("click", () => downloadReport("pdf"));
    } else {
        console.error("PDF button with ID 'btnGeneratePdf' was not found!");
    }
});


// ============================================================================
// POPULATE FILTERS
// ============================================================================

async function populateFilters() {
    const programSelect = document.getElementById("programFilter");
    const yearSelect = document.getElementById("academicYearFilter");
    const statusSelect = document.getElementById("statusFilter");

    // Academic Year
    if (yearSelect) {
        yearSelect.innerHTML = `
            <option value="">Department Year</option>
            <option value="2026-2027">2026/2027</option>
        `;
    }

    // Status
    // Values must match projects.status in the backend exactly.
    if (statusSelect) {
        statusSelect.innerHTML = `
            <option value="">All Status</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="MinorRevision">Minor Revision</option>
            <option value="MajorRevision">Major Revision</option>
            <option value="UnderReview">Under Review</option>
            <option value="UnderDecision">Pending Decision</option>
            <option value="Pending">Pending</option>
        `;
    }

    // Program
    if (programSelect) {
        try {
            const programs = await AdminApi.get("/programs");

            programSelect.innerHTML = `
                <option value="">Program</option>
                ${programs
                    .map(
                        (p) =>
                            `<option value="${p.id}">${p.name}</option>`
                    )
                    .join("")}
            `;
        } catch (err) {
            programSelect.innerHTML = `
                <option value="">Program</option>
            `;
        }
    }
}


// ============================================================================
// ADMIN TOKEN
// ============================================================================

function getAdminToken() {
    return AdminApi.getToken();
}


// ============================================================================
// BUILD REPORT QUERY
// ----------------------------------------------------------------------------
// Builds the query string for:
// GET /api/reports/export/excel
// GET /api/reports/export/pdf
//
// Filters:
// - program
// - academicYear
// - status
//
// "All Status" has value "" and therefore is not added to the query.
// ============================================================================

function buildReportQuery() {
    const params = new URLSearchParams();

    // Program
    const program =
        document.getElementById("programFilter")?.value || "";

    if (program) {
        params.set("program", program);
    }


    // Academic Year
    const academicYear =
        document.getElementById("academicYearFilter")?.value || "";

    if (academicYear) {
        params.set("academicYear", academicYear);
    }


    // Status
    const status =
        document.getElementById("statusFilter")?.value || "";

    if (status) {
        params.set("status", status);
    }

    return params.toString();
}


// ============================================================================
// DOWNLOAD REPORT
// ============================================================================

async function downloadReport(type) {
    const token = getAdminToken();

    if (!token) {
        alert(
            "You need to be signed in as an admin to generate reports."
        );
        return;
    }

    const btnId =
        type === "excel"
            ? "btnGenerateExcel"
            : "btnGeneratePdf";

    const btn = document.getElementById(btnId);
    const originalHtml = btn ? btn.innerHTML : "";

    if (btn) {
        btn.disabled = true;

        btn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Generating...</span>
        `;
    }

    try {
        const query = buildReportQuery();

        const url =
            `${AdminApi.API_BASE_URL}/reports/export/${type}` +
            (query ? "?" + query : "");


        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });


        if (!response.ok) {
            let message =
                `Could not generate the report (HTTP ${response.status}).`;

            try {
                const errorBody = await response.json();

                if (
                    errorBody &&
                    errorBody.error &&
                    errorBody.error.message
                ) {
                    message = errorBody.error.message;
                }
            } catch (e) {
                // Response wasn't JSON.
            }

            throw new Error(message);
        }


        const blob = await response.blob();


        // Prefer the filename sent by the backend.
        const disposition =
            response.headers.get("Content-Disposition") || "";

        const filenameMatch =
            disposition.match(/filename="?([^"]+)"?/);

        const filename = filenameMatch
            ? filenameMatch[1]
            : (
                type === "excel"
                    ? "projects_report.xlsx"
                    : "projects_report.pdf"
            );


        const blobUrl =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = blobUrl;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error(
            `${type} report download failed:`,
            err
        );

        alert(
            err.message ||
            "Could not reach the server. Is the backend running?"
        );

    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}
