/* ============================================================
   DAMECOOPER INSTITUTE — STAFF PORTAL
   ------------------------------------------------------------
   Behind the single sign-in gate at signin.html. No login form.
   Role-guarded to staff and admin only.
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
   ============================================================ */
const API = (function () {
  function getToken() {
    try {
      return (
        localStorage.getItem(CONFIG.TOKEN_STORAGE_KEY) ||
        sessionStorage.getItem(CONFIG.TOKEN_STORAGE_KEY) ||
        null
      );
    } catch (_) { return null; }
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
    } catch (_) { return null; }
  }

  async function request(path, options) {
    options = options || {};
    const headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      options.headers || {}
    );
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(CONFIG.API_BASE_URL + path, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = null;
    try { data = await res.json(); } catch (_) { /* empty */ }

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
    getProfile:   () => request("/staff/profile"),
    getDashboard: () => request("/staff/dashboard"),
    getCourses:   () => request("/staff/courses"),
    getCourseStudents: (code) => request("/staff/courses/" + encodeURIComponent(code) + "/students"),
    getAnnouncements: () => request("/student/announcements"),
    submitAttendance: (payload) => request("/staff/attendance/bulk", { method: "POST", body: payload }),
    getToken,
    clearToken,
    getStoredUser
  };
})();

/* ============================================================
   ROLE GUARD
   ============================================================ */
(function guard() {
  const token = API.getToken();
  const role = sessionStorage.getItem(CONFIG.ROLE_STORAGE_KEY);

  if (!token) {
    window.location.replace("signin.html");
    return;
  }
  if (role && role !== "staff" && role !== "admin") {
    window.location.replace(ROLE_ROUTES[role] || "signin.html");
  }
})();

/* ============================================================
   APP
   ============================================================ */
const App = (function () {
  const state = {
    user: null,
    dashboard: null,
    cache: {
      courses: null,
      announcements: null,
      courseRoster: {}
    }
  };

  const el = {
    portalView: document.getElementById("portalView"),
    sidebar: document.getElementById("sidebar"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    menuBtn: document.getElementById("menuBtn"),
    navItems: document.querySelectorAll(".nav-item"),
    sections: document.querySelectorAll(".portal-section"),
    pageTitle: document.getElementById("pageTitle"),
    headerName: document.getElementById("headerName"),
    headerId: document.getElementById("headerId"),
    userAvatar: document.getElementById("userAvatar"),
    userChip: document.getElementById("userChip"),
    logoutBtn: document.getElementById("logoutBtn"),
    greeting: document.getElementById("greeting"),
    toastStack: document.getElementById("toastStack"),
    notifBadge: document.getElementById("notifBadge"),
    announcementBadge: document.getElementById("announcementBadge"),

    attendanceCourse: document.getElementById("attendanceCourse"),
    attendanceDate: document.getElementById("attendanceDate"),
    loadRosterBtn: document.getElementById("loadRosterBtn"),
    attendanceRosterBody: document.getElementById("attendanceRosterBody")
  };

  const SECTION_TITLES = {
    dashboard:     "Dashboard",
    courses:       "My Courses",
    attendance:    "Attendance",
    announcements: "Announcements"
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
    const iconMap = { info: "fa-circle-info", success: "fa-circle-check", error: "fa-circle-exclamation" };
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

  /* ------------------ Boot ------------------ */
  function boot() {
    const stored = API.getStoredUser();
    if (!stored) {
      API.clearToken();
      window.location.replace("signin.html");
      return;
    }
    state.user = stored;
    hydrateHeader();
    loadDashboard();
  }

  function hydrateHeader() {
    const u = state.user;
    if (!u) return;
    const first = u.firstName || "";
    const last  = u.lastName  || "";
    el.headerName.textContent = (first + " " + last).trim();
    el.headerId.textContent = u.loginId || "—";
    el.userAvatar.textContent =
      u.initials || ((first[0] || "?") + (last[0] || "?")).toUpperCase();
    el.greeting.textContent = "Good day, Dr. " + (last || first) + ".";
  }

  /* ------------------ Logout ------------------ */
  async function handleLogout() {
    try { await API.logout(); } catch (_) { /* ignore */ }
    API.clearToken();
    window.location.replace("signin.html");
  }

  /* ------------------ Section nav ------------------ */
  function showSection(sectionId) {
    el.navItems.forEach(function (item) {
      const active = item.dataset.section === sectionId;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });
    el.sections.forEach(function (s) {
      s.classList.toggle("active", s.id === "section-" + sectionId);
    });
    el.pageTitle.textContent = SECTION_TITLES[sectionId] || "Dashboard";
    document.title = (SECTION_TITLES[sectionId] || "Dashboard") + " | DameCooper Staff Portal";
    closeDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadSection(sectionId);
  }

  function loadSection(sectionId) {
    if (sectionId === "dashboard")     loadDashboard();
    if (sectionId === "courses")       loadCourses();
    if (sectionId === "attendance")    initAttendance();
    if (sectionId === "announcements") loadAnnouncements();
  }

  /* ------------------ Dashboard ------------------ */
  async function loadDashboard() {
    try {
      if (!state.dashboard) state.dashboard = await API.getDashboard();
      renderStats(state.dashboard.stats);
      renderDashboardCourses(state.dashboard.courses);
      renderDashboardToday(state.dashboard.todayClasses);
      renderDashboardAnnouncements(state.dashboard.announcements);

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
    grid.innerHTML =
      statCard("fa-book", "Active courses", stats.activeCourses || 0, "This semester") +
      statCard("fa-users", "Total students", stats.totalStudents || 0, "Across your courses") +
      statCard("fa-clipboard-check", "Awaiting grading", stats.awaitingGrading || 0, "To review") +
      statCard("fa-calendar-day", "Classes today", stats.classesToday || 0, "On your schedule");
  }

  function statCard(icon, label, value, delta) {
    return (
      '<div class="stat-card">' +
        '<div class="stat-icon"><i class="fas ' + icon + '" aria-hidden="true"></i></div>' +
        '<div class="stat-label">' + escapeHTML(label) + '</div>' +
        '<div class="stat-value">' + escapeHTML(value) + '</div>' +
        (delta ? '<div class="stat-delta">' + escapeHTML(delta) + '</div>' : '') +
      '</div>'
    );
  }

  function renderDashboardCourses(courses) {
    const body = document.getElementById("dashboardCourses");
    if (!body) return;
    if (!courses || !courses.length) {
      body.innerHTML = emptyState("fa-book", "No courses assigned",
        "Courses will appear here once the registrar has assigned your teaching.");
      return;
    }
    body.innerHTML =
      '<table class="data-table">' +
        '<thead><tr><th>Course</th><th>Sessions</th><th>Status</th></tr></thead>' +
        '<tbody>' +
          courses.slice(0, 5).map(function (c) {
            return (
              '<tr>' +
                '<td><strong>' + escapeHTML(c.title) + '</strong>' +
                  '<span class="course-code">' + escapeHTML(c.code) + ' · ' +
                  escapeHTML(c.semester || "") + '</span></td>' +
                '<td>' + escapeHTML(c.sessions) + '</td>' +
                '<td><span class="badge-pill badge-success">Active</span></td>' +
              '</tr>'
            );
          }).join("") +
        '</tbody>' +
      '</table>';
  }

  function renderDashboardToday(classes) {
    const body = document.getElementById("dashboardToday");
    if (!body) return;
    if (!classes || !classes.length) {
      body.innerHTML = emptyState("fa-mug-hot", "No classes today",
        "Enjoy the break — check your weekly schedule for the rest of the week.");
      return;
    }
    body.innerHTML = '<div class="schedule-list">' +
      classes.map(function (c) {
        return (
          '<div class="schedule-item">' +
            '<div class="schedule-time">' + escapeHTML(c.time || "") + '</div>' +
            '<div class="schedule-body">' +
              '<h4>' + escapeHTML(c.title) + '</h4>' +
              '<span>Room ' + escapeHTML(c.room || "—") + '</span>' +
            '</div>' +
          '</div>'
        );
      }).join("") +
    '</div>';
  }

  function renderDashboardAnnouncements(list) {
    const body = document.getElementById("dashboardAnnouncements");
    if (!body) return;
    if (!list || !list.length) {
      body.innerHTML = emptyState("fa-bullhorn", "No announcements",
        "You're all caught up.");
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

  /* ------------------ My Courses ------------------ */
  async function loadCourses() {
    const body = document.getElementById("coursesBody");
    if (!body) return;
    try {
      if (!state.cache.courses) state.cache.courses = await API.getCourses();
      const courses = state.cache.courses.courses || [];

      if (!courses.length) {
        body.innerHTML = emptyState("fa-book", "No courses yet",
          "Courses will appear once the registrar has assigned your teaching.");
        return;
      }

      body.innerHTML = courses.map(function (c) {
        return (
          '<div class="content-card" style="margin-bottom:16px;">' +
            '<div class="content-card-head">' +
              '<h3><i class="fas fa-book" aria-hidden="true"></i> ' +
                escapeHTML(c.title) + '</h3>' +
              '<span class="course-code">' + escapeHTML(c.code) + ' · ' +
                escapeHTML(c.semester || "") + '</span>' +
            '</div>' +
            '<div class="content-card-body flush">' +
              '<div style="padding:16px 24px;border-bottom:1px solid var(--border-thin);display:flex;gap:24px;font-size:0.875rem;color:var(--text-secondary);">' +
                '<span><strong style="color:var(--navy);">' + escapeHTML(c.studentCount) + '</strong> students</span>' +
                '<span><strong style="color:var(--navy);">' + escapeHTML(c.sessions) + '</strong> weekly sessions</span>' +
              '</div>' +
              '<div id="courseStudents-' + escapeHTML(c.code) + '" style="padding:16px 24px;">' +
                '<div class="skeleton skeleton-line w60"></div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join("");

      // Lazy load each course's student roster
      courses.forEach(function (c) {
        loadCourseStudents(c.code);
      });
    } catch (err) {
      body.innerHTML = errorState(err);
    }
  }

  async function loadCourseStudents(courseCode) {
    const host = document.getElementById("courseStudents-" + courseCode);
    if (!host) return;
    try {
      if (!state.cache.courseRoster[courseCode]) {
        state.cache.courseRoster[courseCode] = await API.getCourseStudents(courseCode);
      }
      const roster = state.cache.courseRoster[courseCode].students || [];

      if (!roster.length) {
        host.innerHTML = '<p style="font-size:0.875rem;color:var(--text-secondary);">No students enrolled yet.</p>';
        return;
      }

      host.innerHTML = roster.map(function (s) {
        return (
          '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-thin);">' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--ivory);color:var(--gold-dark);font-size:0.6875rem;font-weight:700;">' +
              escapeHTML((s.firstName[0] || "") + (s.lastName[0] || "")) +
            '</span>' +
            '<div style="flex:1;">' +
              '<div style="font-size:0.875rem;font-weight:600;color:var(--navy);">' +
                escapeHTML(s.firstName + " " + s.lastName) + '</div>' +
              '<div style="font-size:0.75rem;color:var(--text-secondary);">' +
                escapeHTML(s.loginId) + ' · ' + escapeHTML(s.email) + '</div>' +
            '</div>' +
          '</div>'
        );
      }).join("");
    } catch (err) {
      host.innerHTML = '<p style="font-size:0.875rem;color:var(--danger);">Couldn\'t load students.</p>';
    }
  }

  /* ------------------ Attendance ------------------ */
  async function initAttendance() {
    if (!el.attendanceCourse) return;

    // Only populate the dropdown once
    if (!el.attendanceCourse.options.length) {
      try {
        if (!state.cache.courses) state.cache.courses = await API.getCourses();
        const courses = state.cache.courses.courses || [];

        if (!courses.length) {
          el.attendanceCourse.innerHTML = '<option value="">No courses assigned</option>';
          return;
        }

        el.attendanceCourse.innerHTML =
          '<option value="">Select a course</option>' +
          courses.map(function (c) {
            return '<option value="' + escapeHTML(c.code) + '">' +
              escapeHTML(c.title) + ' (' + escapeHTML(c.code) + ')</option>';
          }).join("");

        // Default the date to today
        if (!el.attendanceDate.value) {
          el.attendanceDate.value = new Date().toISOString().slice(0, 10);
        }
      } catch (err) {
        el.attendanceCourse.innerHTML = '<option value="">Couldn\'t load courses</option>';
      }
    }
  }

  async function loadRoster() {
    const courseCode = el.attendanceCourse.value;
    const date = el.attendanceDate.value;

    if (!courseCode) {
      toast("Please select a course first.", "error");
      return;
    }
    if (!date) {
      toast("Please select a date.", "error");
      return;
    }

    el.loadRosterBtn.disabled = true;
    el.loadRosterBtn.innerHTML = 'Loading… <i class="fas fa-circle-notch" aria-hidden="true"></i>';

    try {
      const roster = state.cache.courseRoster[courseCode] ||
        await API.getCourseStudents(courseCode);
      state.cache.courseRoster[courseCode] = roster;

      const students = roster.students || [];
      if (!students.length) {
        el.attendanceRosterBody.innerHTML = emptyState("fa-users", "No students in this course",
          "Once students are enrolled, you'll be able to mark attendance here.");
        return;
      }

      el.attendanceRosterBody.innerHTML =
        '<div class="content-card">' +
          '<div class="content-card-head">' +
            '<h3><i class="fas fa-users" aria-hidden="true"></i> ' +
              escapeHTML(roster.courseTitle) + ' · ' +
              escapeHTML(date) + '</h3>' +
            '<span style="font-size:0.8125rem;color:var(--text-secondary);">' +
              students.length + ' students</span>' +
          '</div>' +
          '<div class="content-card-body flush">' +
            '<div id="attendanceRows">' +
              students.map(function (s) {
                return (
                  '<div class="attendance-row" data-student-id="' + escapeHTML(s.id) + '" style="display:flex;align-items:center;gap:16px;padding:14px 24px;border-bottom:1px solid var(--border-thin);">' +
                    '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--ivory);color:var(--gold-dark);font-size:0.75rem;font-weight:700;">' +
                      escapeHTML((s.firstName[0] || "") + (s.lastName[0] || "")) +
                    '</span>' +
                    '<div style="flex:1;">' +
                      '<div style="font-size:0.9375rem;font-weight:600;color:var(--navy);">' +
                        escapeHTML(s.firstName + " " + s.lastName) + '</div>' +
                      '<div style="font-size:0.75rem;color:var(--text-secondary);">' +
                        escapeHTML(s.loginId) + '</div>' +
                    '</div>' +
                    '<div class="attendance-options" style="display:flex;gap:6px;">' +
                      '<button type="button" class="btn btn-sm" data-status="present">Present</button>' +
                      '<button type="button" class="btn btn-sm" data-status="late">Late</button>' +
                      '<button type="button" class="btn btn-sm" data-status="excused">Excused</button>' +
                      '<button type="button" class="btn btn-sm" data-status="absent">Absent</button>' +
                    '</div>' +
                  '</div>'
                );
              }).join("") +
            '</div>' +
            '<div style="padding:20px 24px;background:var(--ivory);border-top:1px solid var(--border-thin);display:flex;justify-content:flex-end;">' +
              '<button type="button" class="btn btn-gold" id="saveAttendanceBtn">' +
                '<i class="fas fa-check" aria-hidden="true"></i> Save attendance' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      bindAttendanceRows();
    } catch (err) {
      el.attendanceRosterBody.innerHTML = errorState(err);
    } finally {
      el.loadRosterBtn.disabled = false;
      el.loadRosterBtn.innerHTML = '<i class="fas fa-users" aria-hidden="true"></i> Load roster';
    }
  }

  function bindAttendanceRows() {
    // Each row: track the selected status
    document.querySelectorAll(".attendance-row").forEach(function (row) {
      row.dataset.status = "";

      row.querySelectorAll("[data-status]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const status = this.dataset.status;

          // Clear all sibling buttons
          row.querySelectorAll("[data-status]").forEach(function (b) {
            b.classList.remove("btn-gold");
            b.classList.add("btn-outline-navy");
          });

          // Mark this one as selected
          this.classList.remove("btn-outline-navy");
          this.classList.add("btn-gold");

          row.dataset.status = status;
        });
      });
    });

    const saveBtn = document.getElementById("saveAttendanceBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveAttendance);
  }

  async function saveAttendance() {
    const courseCode = el.attendanceCourse.value;
    const date = el.attendanceDate.value;
    if (!courseCode || !date) return;

    const rows = document.querySelectorAll(".attendance-row");
    const records = [];
    let skipped = 0;

    rows.forEach(function (row) {
      const studentId = row.dataset.studentId;
      const status = row.dataset.status;
      if (!status) { skipped += 1; return; }
      records.push({ studentId, status });
    });

    if (!records.length) {
      toast("Please mark at least one student.", "error");
      return;
    }

    const roster = state.cache.courseRoster[courseCode];
    const courseTitle = roster ? roster.courseTitle : courseCode;

    const saveBtn = document.getElementById("saveAttendanceBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Saving… <i class="fas fa-circle-notch" aria-hidden="true"></i>';

    try {
      await API.submitAttendance({
        courseCode,
        courseTitle,
        date,
        records
      });
      toast(
        "Attendance saved. " + records.length + " student(s) marked" +
        (skipped ? " (" + skipped + " skipped)." : "."),
        "success"
      );
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Save attendance';
    } catch (err) {
      toast(err.message || "Couldn't save attendance.", "error");
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Save attendance';
    }
  }

  /* ------------------ Announcements ------------------ */
  async function loadAnnouncements() {
    const body = document.getElementById("announcementsBody");
    if (!body) return;
    try {
      if (!state.cache.announcements) {
        state.cache.announcements = await API.getAnnouncements();
      }
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

  /* ------------------ Drawer ------------------ */
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

    el.userChip.addEventListener("click", function () {
      showSection("dashboard");
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

    if (el.loadRosterBtn) {
      el.loadRosterBtn.addEventListener("click", loadRoster);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function init() {
    bind();
    boot();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);