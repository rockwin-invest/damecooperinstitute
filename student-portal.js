/* ============================================================
   DAMECOOPER INSTITUTE — STUDENT PORTAL
   ------------------------------------------------------------
   This page is behind the single sign-in gate at signin.html.
   It does NOT have its own login form. On load it checks for a
   valid token and the "student" role, and redirects if either
   is missing.
   ============================================================ */

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  API_BASE_URL: "https://damecooperinstitute.onrender.com/api",
  TOKEN_STORAGE_KEY: "dc_portal_token",
  ROLE_STORAGE_KEY: "dc_portal_role",
  USER_STORAGE_KEY: "dc_portal_student"
};

const ROLE_ROUTES = {
  student: "student-portal.html",
  staff:   "staff-portal.html",
  admin:   "admin-portal.html"
};

/* ============================================================
   API LAYER
   ------------------------------------------------------------
   Every request goes through request(). Reads the token from
   whichever storage signin.js used, attaches it as a Bearer
   header, and normalises error responses into thrown Error
   objects with a .status and .code.
   ============================================================ */
const API = (function () {
  function getToken() {
    try {
      return (
        localStorage.getItem(CONFIG.TOKEN_STORAGE_KEY) ||
        sessionStorage.getItem(CONFIG.TOKEN_STORAGE_KEY) ||
        null
      );
    } catch (_) {
      return null;
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(CONFIG.ROLE_STORAGE_KEY);
      sessionStorage.removeItem(CONFIG.USER_STORAGE_KEY);
    } catch (_) { /* ignore */ }
  }

  function getStoredUser() {
    try {
      const raw = sessionStorage.getItem(CONFIG.USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function request(path, options) {
    options = options || {};
    const method = options.method || "GET";
    const body = options.body || null;

    const headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      options.headers || {}
    );

    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(CONFIG.API_BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try { data = await res.json(); } catch (_) { /* empty body */ }

    if (!res.ok) {
      const err = new Error((data && data.message) || "Request failed");
      err.status = res.status;
      err.code = data && data.code;
      throw err;
    }

    return data;
  }

  return {
    logout:       () => request("/auth/logout", { method: "POST" }),
    getProfile:   () => request("/student/profile"),
    getGrades:    () => request("/student/grades"),
    getTimetable: () => request("/student/timetable"),
    getFees:      () => request("/student/fees"),
    getAnnouncements: () => request("/student/announcements"),
    getDocuments: () => request("/student/documents"),
    getDashboard: () => request("/student/dashboard"),
    getAttendance: () => request("/student/attendance"),
    changePassword: (currentPassword, newPassword) =>
      request("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword }
      }),
    getToken,
    clearToken,
    getStoredUser
  };
})();

/* ============================================================
   ROLE GUARD
   ------------------------------------------------------------
   Runs before anything else. If the visitor isn't an
   authenticated student, they never see the portal UI.
   ============================================================ */
(function guard() {
  const token = API.getToken();
  const role = sessionStorage.getItem(CONFIG.ROLE_STORAGE_KEY);

  if (!token) {
    window.location.replace("signin.html");
    return;
  }

  if (role && role !== "student") {
    window.location.replace(ROLE_ROUTES[role] || "signin.html");
  }
})();

/* ============================================================
   APP — UI ORCHESTRATION
   ============================================================ */
const App = (function () {
  const state = {
    student: null,
    dashboard: null,
    cache: {
      grades: null,
      timetable: null,
      fees: null,
      announcements: null,
      documents: null,
      attendance: null
    }
  };

  const el = {
    portalView: document.getElementById("portalView"),
    logoutBtn: document.getElementById("logoutBtn"),
    sidebar: document.getElementById("portalSidebar"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    menuBtn: document.getElementById("menuBtn"),
    navItems: document.querySelectorAll(".nav-item"),
    sections: document.querySelectorAll(".portal-section"),
    pageTitle: document.getElementById("pageTitle"),
    headerName: document.getElementById("headerName"),
    headerAdm: document.getElementById("headerAdm"),
    userAvatar: document.getElementById("userAvatar"),
    userChip: document.getElementById("userChip"),
    toastStack: document.getElementById("toastStack"),
    notifBadge: document.getElementById("notifBadge"),
    announcementBadge: document.getElementById("announcementBadge"),

    // Change password modal
    changePasswordBtn: document.getElementById("changePasswordBtn"),
    changePasswordModal: document.getElementById("changePasswordModal"),
    changePasswordClose: document.getElementById("changePasswordClose"),
    changePasswordCancel: document.getElementById("changePasswordCancel"),
    changePasswordForm: document.getElementById("changePasswordForm"),
    changePasswordSubmit: document.getElementById("changePasswordSubmit"),
    cpCurrent: document.getElementById("cpCurrent"),
    cpNew: document.getElementById("cpNew"),
    cpConfirm: document.getElementById("cpConfirm"),
    cpMessage: document.getElementById("cpMessage")
  };

  const SECTION_TITLES = {
    dashboard:     "Dashboard",
    profile:       "My Profile",
    grades:        "Grades",
    attendance:    "Attendance",
    timetable:     "Timetable",
    fees:          "Fees & Payments",
    announcements: "Announcements",
    documents:     "Documents"
  };

  /* ------------------ Helpers ------------------ */
  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toast(message, kind) {
    kind = kind || "info";
    const iconMap = {
      info: "fa-circle-info",
      success: "fa-circle-check",
      error: "fa-circle-exclamation"
    };
    const node = document.createElement("div");
    node.className = "toast " + kind;
    node.innerHTML =
      '<i class="fas ' + (iconMap[kind] || iconMap.info) + '" aria-hidden="true"></i>' +
      '<span>' + escapeHTML(message) + '</span>';
    el.toastStack.appendChild(node);
    setTimeout(function () {
      node.style.opacity = "0";
      node.style.transform = "translateY(10px)";
      node.style.transition = "all 0.3s ease";
      setTimeout(function () { node.remove(); }, 300);
    }, 4200);
  }

  /* ------------------ Session boot ------------------ */
  function boot() {
    const stored = API.getStoredUser();
    if (!stored) {
      API.clearToken();
      window.location.replace("signin.html");
      return;
    }
    state.student = stored;
    hydrateHeader();
    loadDashboard();
  }

  function hydrateHeader() {
    const s = state.student;
    if (!s) return;
    el.headerName.textContent = (s.firstName || "") + " " + (s.lastName || "");
    el.headerAdm.textContent = s.loginId || s.admissionNo || "—";
    el.userAvatar.textContent =
      s.initials || ((s.firstName || "?")[0] + (s.lastName || "?")[0]);
  }

  /* ------------------ Logout ------------------ */
  async function handleLogout() {
    try { await API.logout(); } catch (_) { /* ignore */ }
    API.clearToken();
    window.location.replace("signin.html");
  }

  /* ------------------ Section navigation ------------------ */
  function showSection(sectionId) {
    el.navItems.forEach(function (item) {
      const isActive = item.dataset.section === sectionId;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-current", isActive ? "page" : "false");
    });
    el.sections.forEach(function (s) {
      s.classList.toggle("active", s.id === "section-" + sectionId);
    });
    el.pageTitle.textContent = SECTION_TITLES[sectionId] || "Dashboard";
    document.title =
      (SECTION_TITLES[sectionId] || "Dashboard") +
      " | DameCooper Student Portal";
    closeDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadSection(sectionId);
  }

  function loadSection(sectionId) {
    if (sectionId === "dashboard")     loadDashboard();
    if (sectionId === "profile")       loadProfile();
    if (sectionId === "grades")        loadGrades();
    if (sectionId === "attendance")    loadAttendance();
    if (sectionId === "timetable")     loadTimetable();
    if (sectionId === "fees")          loadFees();
    if (sectionId === "announcements") loadAnnouncements();
    if (sectionId === "documents")     loadDocuments();
  }

  /* ------------------ Loaders ------------------ */
  async function loadDashboard() {
    try {
      if (!state.dashboard) {
        state.dashboard = await API.getDashboard();
      }
      renderStats(state.dashboard.stats);
      renderDashboardAnnouncements(state.dashboard.announcements);
      renderDashboardToday(state.dashboard.todayClasses);
      const unread = (state.dashboard.announcements || []).length;
      if (el.notifBadge) el.notifBadge.textContent = String(unread);
      if (el.announcementBadge) el.announcementBadge.textContent = String(unread);
    } catch (err) {
      handleApiError(err);
    }
  }

  function renderStats(stats) {
    const grid = document.getElementById("statGrid");
    if (!grid) return;

    const attendanceValue =
      stats.attendancePercent == null
        ? "—"
        : stats.attendancePercent + "%";

    grid.innerHTML =
      statCard("fa-chart-line", "Current GPA", stats.gpa || "—", "Up from 6.9 last semester") +
      statCard("fa-book", "Credits this year", stats.creditsThisYear || 0, "Across all semesters") +
      statCard("fa-receipt", "Outstanding fees",
        (stats.currency || "NZD") + " " + Number(stats.outstandingFees || 0).toLocaleString(),
        "Due by 15 July") +
      statCard("fa-calendar-check", "Attendance", attendanceValue, "Present or excused");
  }

  function statCard(icon, label, value, delta) {
    return (
      '<div class="stat-card">' +
        '<div class="stat-icon"><i class="fas ' + icon + '" aria-hidden="true"></i></div>' +
        '<div class="stat-label">' + escapeHTML(label) + '</div>' +
        '<div class="stat-value">' + escapeHTML(value) + '</div>' +
        (delta
          ? '<div class="stat-delta"><i class="fas fa-arrow-trend-up" aria-hidden="true"></i>' +
            escapeHTML(delta) + '</div>'
          : '') +
      '</div>'
    );
  }

  function renderDashboardAnnouncements(list) {
    const body = document.getElementById("dashboardAnnouncements");
    if (!body) return;
    if (!list || !list.length) {
      body.innerHTML = emptyState("fa-bullhorn", "No new announcements", "You're all caught up.");
      return;
    }
    body.innerHTML = '<div class="announcement-list">' +
      list.map(function (a) {
        return (
          '<div class="announcement">' +
            '<span class="announcement-icon"><i class="fas fa-bullhorn" aria-hidden="true"></i></span>' +
            '<div class="announcement-body">' +
              '<div class="announcement-meta"><span class="tag">' +
                escapeHTML(a.tag) + '</span><span>' + escapeHTML(a.date) + '</span></div>' +
              '<h4>' + escapeHTML(a.title) + '</h4>' +
              '<p>' + escapeHTML(a.body) + '</p>' +
            '</div>' +
          '</div>'
        );
      }).join("") +
    '</div>';
  }

  function renderDashboardToday(classes) {
    const body = document.getElementById("dashboardToday");
    if (!body) return;
    if (!classes || !classes.length) {
      body.innerHTML = emptyState("fa-mug-hot", "No classes today",
        "Enjoy the break — check your full timetable for the week.");
      return;
    }
    body.innerHTML = classes.map(function (c) {
      return (
        '<div class="class-slot">' +
          '<div class="class-time">' + escapeHTML(c.time) + '</div>' +
          '<div class="class-info"><h5>' + escapeHTML(c.title) +
            '</h5><span>' + escapeHTML(c.lecturer || "") + '</span></div>' +
          '<div class="class-room">' + escapeHTML(c.room) + '</div>' +
        '</div>'
      );
    }).join("");
  }

  async function loadProfile() {
    const body = document.getElementById("profileBody");
    if (!body) return;
    try {
      const s = state.student || await API.getProfile();
      state.student = s;
      body.innerHTML =
        '<div class="content-grid" style="gap:24px;">' +
          fieldBlock("Full name",       (s.firstName || "") + " " + (s.lastName || "")) +
          fieldBlock("DameCooper ID",   s.loginId || s.admissionNo) +
          fieldBlock("Email",           s.email) +
          fieldBlock("Phone",           s.phone) +
          fieldBlock("Date of birth",   s.dateOfBirth) +
          fieldBlock("Nationality",     s.nationality) +
          fieldBlock("Programme",       s.programme && s.programmeCode
            ? s.programme + " (" + s.programmeCode + ")"
            : s.programme) +
          fieldBlock("School",          s.school) +
          fieldBlock("Level",           s.level) +
          fieldBlock("Study mode",      s.studyMode) +
          fieldBlock("Academic advisor", s.advisor) +
          fieldBlock("Campus",          s.campus) +
        '</div>';
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  function fieldBlock(label, value) {
    return (
      '<div style="padding:14px 0;border-bottom:1px solid var(--border-thin);">' +
        '<div style="font-size:0.6875rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">' +
          escapeHTML(label) +
        '</div>' +
        '<div style="font-size:0.9375rem;color:var(--navy);font-weight:500;">' +
          escapeHTML(value || "—") +
        '</div>' +
      '</div>'
    );
  }

  async function loadGrades() {
    const body = document.getElementById("gradesBody");
    if (!body) return;
    try {
      if (!state.cache.grades) state.cache.grades = await API.getGrades();
      const grades = state.cache.grades.grades || [];
      if (!grades.length) {
        body.innerHTML = emptyState("fa-graduation-cap", "No grades yet",
          "Your results will appear here once they are released.");
        return;
      }
      body.innerHTML =
        '<table class="grade-table">' +
          '<thead><tr>' +
            '<th>Course</th><th>Credits</th><th>Grade</th><th>Points</th>' +
          '</tr></thead>' +
          '<tbody>' +
            grades.map(function (g) {
              const letter = (g.grade || "").charAt(0).toUpperCase();
              const cls = ["A","B","C","D","F"].includes(letter) ? "grade-" + letter : "grade-B";
              return (
                '<tr>' +
                  '<td><strong>' + escapeHTML(g.title) + '</strong><span class="grade-code">' +
                    escapeHTML(g.code) + '</span></td>' +
                  '<td>' + escapeHTML(g.credits) + '</td>' +
                  '<td><span class="grade-badge ' + cls + '">' +
                    escapeHTML(g.grade) + '</span></td>' +
                  '<td>' + escapeHTML(g.points) + '</td>' +
                '</tr>'
              );
            }).join("") +
          '</tbody>' +
        '</table>';
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadAttendance() {
    const summary = document.getElementById("attendanceSummary");
    const body = document.getElementById("attendanceBody");
    if (!body) return;

    try {
      if (!state.cache.attendance) {
        state.cache.attendance = await API.getAttendance();
      }
      const a = state.cache.attendance;

      if (summary) {
        const percent = a.attendancePercent == null ? "—" : a.attendancePercent + "%";
        summary.innerHTML =
          statCard("fa-percent", "Overall attendance", percent,
            a.total ? a.present + " of " + a.total + " sessions" : "No records yet") +
          statCard("fa-calendar-check", "Sessions attended", a.present || 0,
            "Present or excused") +
          statCard("fa-calendar-xmark", "Missed sessions",
            (a.total || 0) - (a.present || 0), "Absent or late") +
          statCard("fa-chart-simple", "Courses tracked",
            (a.courses || []).length, "With recorded attendance");
      }

      if (!a.records || !a.records.length) {
        body.innerHTML = emptyState("fa-user-check", "No attendance records",
          "Your attendance will appear here once staff have marked classes.");
        return;
      }

      const statusClass = {
        present: "badge-success",
        excused: "badge-info",
        late:    "badge-warning",
        absent:  "badge-danger"
      };
      const statusLabel = {
        present: "Present",
        excused: "Excused",
        late:    "Late",
        absent:  "Absent"
      };

      body.innerHTML =
        '<table class="grade-table">' +
          '<thead><tr>' +
            '<th>Date</th><th>Course</th><th>Status</th>' +
          '</tr></thead>' +
          '<tbody>' +
            a.records.map(function (r) {
              const d = r.date ? new Date(r.date).toISOString().slice(0, 10) : "—";
              return (
                '<tr>' +
                  '<td>' + escapeHTML(d) + '</td>' +
                  '<td><strong>' + escapeHTML(r.courseTitle) + '</strong>' +
                    '<span class="grade-code">' + escapeHTML(r.courseCode) + '</span></td>' +
                  '<td><span class="badge-pill ' + (statusClass[r.status] || "badge-info") + '">' +
                    escapeHTML(statusLabel[r.status] || r.status) + '</span></td>' +
                '</tr>'
              );
            }).join("") +
          '</tbody>' +
        '</table>';
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadTimetable() {
    const body = document.getElementById("timetableBody");
    if (!body) return;
    try {
      if (!state.cache.timetable) state.cache.timetable = await API.getTimetable();
      const days = state.cache.timetable.days || {};
      const order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const html = order
        .filter(function (d) { return days[d] && days[d].length; })
        .map(function (d) {
          return (
            '<div class="timetable-day">' +
              '<h4>' + escapeHTML(d) + '</h4>' +
              days[d].map(function (c) {
                return (
                  '<div class="class-slot">' +
                    '<div class="class-time">' + escapeHTML(c.time) + '</div>' +
                    '<div class="class-info"><h5>' + escapeHTML(c.title) +
                      '</h5><span>' + escapeHTML(c.lecturer || "") + '</span></div>' +
                    '<div class="class-room">' + escapeHTML(c.room) + '</div>' +
                  '</div>'
                );
              }).join("") +
            '</div>'
          );
        }).join("");
      body.innerHTML = html || emptyState("fa-calendar-days",
        "No timetable available", "Your schedule has not been published yet.");
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadFees() {
    const body = document.getElementById("feesBody");
    if (!body) return;
    try {
      if (!state.cache.fees) state.cache.fees = await API.getFees();
      const f = state.cache.fees;
      const currency = f.currency || "NZD";
      body.innerHTML =
        '<div class="fee-summary">' +
          '<div class="fee-box"><div class="fee-box-label">Total fees</div>' +
            '<div class="fee-box-value">' + currency + ' ' +
              Number(f.total).toLocaleString() + '</div></div>' +
          '<div class="fee-box paid"><div class="fee-box-label">Paid to date</div>' +
            '<div class="fee-box-value">' + currency + ' ' +
              Number(f.paid).toLocaleString() + '</div></div>' +
          '<div class="fee-box due"><div class="fee-box-label">Outstanding</div>' +
            '<div class="fee-box-value">' + currency + ' ' +
              Number(f.outstanding).toLocaleString() + '</div></div>' +
        '</div>' +
        '<div class="content-card">' +
          '<div class="content-card-head"><h3><i class="fas fa-list" aria-hidden="true"></i> Fee statement</h3></div>' +
          '<div style="padding:0;">' +
            '<table class="fee-table">' +
              '<thead><tr><th>Reference</th><th>Description</th><th>Amount</th><th>Due date</th><th>Status</th></tr></thead>' +
              '<tbody>' +
                (f.items || []).map(function (item) {
                  const cls = item.status === "paid" ? "paid" : "due";
                  const label = item.status === "paid" ? "Paid" : "Due";
                  return (
                    '<tr>' +
                      '<td>' + escapeHTML(item.reference || item.id) + '</td>' +
                      '<td>' + escapeHTML(item.description) + '</td>' +
                      '<td>' + currency + ' ' + Number(item.amount).toLocaleString() + '</td>' +
                      '<td>' + escapeHTML(item.dueDate) + '</td>' +
                      '<td><span class="fee-status ' + cls + '"><i class="fas ' +
                        (cls === "paid" ? "fa-check" : "fa-clock") + '" aria-hidden="true"></i>' +
                        label + '</span></td>' +
                    '</tr>'
                  );
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadAnnouncements() {
    const body = document.getElementById("announcementsBody");
    if (!body) return;
    try {
      if (!state.cache.announcements)
        state.cache.announcements = await API.getAnnouncements();
      const items = state.cache.announcements.announcements || [];
      if (!items.length) {
        body.innerHTML = emptyState("fa-bullhorn", "No announcements",
          "There are no announcements to display.");
        return;
      }
      body.innerHTML = '<div class="announcement-list">' +
        items.map(function (a) {
          return (
            '<div class="announcement">' +
              '<span class="announcement-icon"><i class="fas fa-bullhorn" aria-hidden="true"></i></span>' +
              '<div class="announcement-body">' +
                '<div class="announcement-meta"><span class="tag">' +
                  escapeHTML(a.tag) + '</span><span>' + escapeHTML(a.date) + '</span></div>' +
                '<h4>' + escapeHTML(a.title) + '</h4>' +
                '<p>' + escapeHTML(a.body) + '</p>' +
              '</div>' +
            '</div>'
          );
        }).join("") +
      '</div>';
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadDocuments() {
    const body = document.getElementById("documentsBody");
    if (!body) return;
    try {
      if (!state.cache.documents) state.cache.documents = await API.getDocuments();
      const items = state.cache.documents.documents || [];
      if (!items.length) {
        body.innerHTML = emptyState("fa-folder-open", "No documents",
          "There are no documents available for download yet.");
        return;
      }
      body.innerHTML = items.map(function (d) {
        const id = d._id || d.id;
        return (
          '<a class="doc-card" href="#" data-doc="' + escapeHTML(id) + '">' +
            '<span class="doc-icon"><i class="fas fa-file-pdf" aria-hidden="true"></i></span>' +
            '<span class="doc-meta"><strong>' + escapeHTML(d.name) +
              '</strong><span>' + escapeHTML(d.type) + ' · ' +
              escapeHTML(d.size) + ' · Updated ' + escapeHTML(d.updatedAt) +
              '</span></span>' +
          '</a>'
        );
      }).join("");

      body.querySelectorAll("[data-doc]").forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          downloadDocument(this.dataset.doc);
        });
      });
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function downloadDocument(docId) {
    const token = API.getToken();
    if (!token) {
      API.clearToken();
      window.location.replace("signin.html");
      return;
    }

    toast("Preparing your download…", "info");

    try {
      const res = await fetch(
        CONFIG.API_BASE_URL + "/student/documents/" + docId + "/download",
        {
          method: "GET",
          headers: { Authorization: "Bearer " + token }
        }
      );

      if (res.status === 401) {
        API.clearToken();
        window.location.replace("signin.html");
        return;
      }

      if (!res.ok) {
        let msg = "Couldn't download the document.";
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch (_) { /* ignore */ }
        toast(msg, "error");
        return;
      }

      // Pull the filename from Content-Disposition, fall back to a generic name
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match ? match[1] : "document.pdf";

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);

      toast("Download started.", "success");
    } catch (err) {
      toast("Couldn't download the document. Please try again.", "error");
    }
  }

  function emptyState(icon, title, text) {
    return (
      '<div class="state-block">' +
        '<i class="fas ' + icon + '" aria-hidden="true"></i>' +
        '<h4>' + escapeHTML(title) + '</h4>' +
        '<p>' + escapeHTML(text) + '</p>' +
      '</div>'
    );
  }

  function errorState(err) {
    return (
      '<div class="state-block">' +
        '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<h4>We couldn\'t load this section</h4>' +
        '<p>' + escapeHTML((err && err.message) || "Please try again in a moment.") + '</p>' +
      '</div>'
    );
  }

  function handleApiError(err) {
    if (err && err.status === 401) {
      API.clearToken();
      window.location.replace("signin.html");
      return;
    }
    toast((err && err.message) || "Something went wrong.", "error");
  }

  /* ------------------ Change password modal ------------------ */
  function openChangePassword() {
    if (!el.changePasswordModal) return;
    el.changePasswordModal.classList.add("show");
    el.changePasswordModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (el.cpMessage) el.cpMessage.style.display = "none";
    if (el.changePasswordForm) el.changePasswordForm.reset();
    setTimeout(function () {
      if (el.cpCurrent) el.cpCurrent.focus();
    }, 80);
  }

  function closeChangePassword() {
    if (!el.changePasswordModal) return;
    el.changePasswordModal.classList.remove("show");
    el.changePasswordModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (el.changePasswordForm) el.changePasswordForm.reset();
  }

  function showCpMessage(kind, text) {
    if (!el.cpMessage) return;
    const colors = {
      error:   ["#fbeaea", "#b23a3a"],
      success: ["#e8f4ee", "#2e7d5b"],
      info:    ["#e8f0f6", "#315c76"]
    };
    const pair = colors[kind] || colors.info;
    el.cpMessage.style.display = "flex";
    el.cpMessage.style.background = pair[0];
    el.cpMessage.style.color = pair[1];
    el.cpMessage.style.borderLeft = "3px solid " + pair[1];
    el.cpMessage.textContent = text;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!el.cpCurrent || !el.cpNew || !el.cpConfirm) return;

    const current = el.cpCurrent.value;
    const next = el.cpNew.value;
    const confirm = el.cpConfirm.value;

    if (!current) {
      showCpMessage("error", "Please enter your current password.");
      el.cpCurrent.focus();
      return;
    }
    if (!next || next.length < 8) {
      showCpMessage("error", "New password must be at least 8 characters.");
      el.cpNew.focus();
      return;
    }
    if (next !== confirm) {
      showCpMessage("error", "The two new passwords do not match.");
      el.cpConfirm.focus();
      return;
    }
    if (current === next) {
      showCpMessage("error", "New password must be different from your current one.");
      el.cpNew.focus();
      return;
    }

    el.changePasswordSubmit.disabled = true;
    el.changePasswordSubmit.innerHTML =
      'Updating… <i class="fas fa-circle-notch" aria-hidden="true"></i>';

    try {
      await API.changePassword(current, next);
      showCpMessage("success", "Password updated successfully.");
      setTimeout(function () {
        closeChangePassword();
        el.changePasswordSubmit.disabled = false;
        el.changePasswordSubmit.textContent = "Update password";
        toast("Your password has been updated.", "success");
      }, 1200);
    } catch (err) {
      showCpMessage("error", err.message || "Couldn't update password.");
      el.changePasswordSubmit.disabled = false;
      el.changePasswordSubmit.textContent = "Update password";
    }
  }

  /* ------------------ Mobile drawer ------------------ */
  function openDrawer() {
    el.sidebar.classList.add("open");
    el.drawerOverlay.classList.add("active");
    el.menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    el.sidebar.classList.remove("open");
    el.drawerOverlay.classList.remove("active");
    el.menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  /* ------------------ Wire up ------------------ */
  function bind() {
    el.logoutBtn.addEventListener("click", handleLogout);

    el.userChip.addEventListener("click", function (e) {
      e.preventDefault();
      showSection("profile");
    });

    el.navItems.forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        showSection(this.dataset.section);
      });
    });

    document.querySelectorAll("[data-goto]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showSection(this.dataset.goto);
      });
    });

    el.menuBtn.addEventListener("click", openDrawer);
    el.drawerOverlay.addEventListener("click", closeDrawer);

    // Change password modal
    if (el.changePasswordBtn) {
      el.changePasswordBtn.addEventListener("click", openChangePassword);
    }
    if (el.changePasswordClose) {
      el.changePasswordClose.addEventListener("click", closeChangePassword);
    }
    if (el.changePasswordCancel) {
      el.changePasswordCancel.addEventListener("click", closeChangePassword);
    }
    if (el.changePasswordModal) {
      el.changePasswordModal.addEventListener("click", function (e) {
        if (e.target === el.changePasswordModal) closeChangePassword();
      });
    }
    if (el.changePasswordForm) {
      el.changePasswordForm.addEventListener("submit", handleChangePassword);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (el.changePasswordModal && el.changePasswordModal.classList.contains("show")) {
          closeChangePassword();
          return;
        }
        closeDrawer();
      }
    });
  }

  function init() {
    bind();
    boot();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);