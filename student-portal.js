 /* ============================================================
     STUDENT PORTAL — CONFIGURATION
     ============================================================
     To go live, change USE_MOCK_API to false and point
     API_BASE_URL at your backend. The API contract is documented
     in the companion server.js reference file.
     ============================================================ */
  const CONFIG = {
    USE_MOCK_API: true,
    API_BASE_URL: "/api",
    TOKEN_STORAGE_KEY: "dc_portal_token",
    STUDENT_STORAGE_KEY: "dc_portal_student",
    SESSION_TIMEOUT_MS: 1000 * 60 * 60 * 4 // 4 hours
  };

  /* ============================================================
     API LAYER
     ------------------------------------------------------------
     Single point through which every request flows.
     - When USE_MOCK_API is true, requests are routed to MOCK_API.
     - When false, real fetch() calls are issued with the Bearer
       token attached automatically.
     ============================================================ */
  const API = (function () {
    function getToken() {
      try {
        const raw = localStorage.getItem(CONFIG.TOKEN_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.token) return null;
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
          return null;
        }
        return parsed.token;
      } catch {
        return null;
      }
    }

    function setToken(token) {
      const payload = {
        token,
        expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT_MS
      };
      localStorage.setItem(CONFIG.TOKEN_STORAGE_KEY, JSON.stringify(payload));
    }

    function clearToken() {
      localStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(CONFIG.STUDENT_STORAGE_KEY);
    }

    function getStoredStudent() {
      try {
        const raw = localStorage.getItem(CONFIG.STUDENT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function setStoredStudent(student) {
      localStorage.setItem(CONFIG.STUDENT_STORAGE_KEY, JSON.stringify(student));
    }

    async function request(path, options) {
      options = options || {};
      const method = options.method || "GET";
      const body = options.body || null;

      if (CONFIG.USE_MOCK_API) {
        return MOCK_API.handle(method, path, body, options);
      }

      const headers = Object.assign(
        { "Content-Type": "application/json" },
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
      try { data = await res.json(); } catch { /* empty */ }

      if (!res.ok) {
        const err = new Error((data && data.message) || "Request failed");
        err.status = res.status;
        err.code = data && data.code;
        throw err;
      }

      return data;
    }

    return {
      login: (admissionNo, password) =>
        request("/auth/login", { method: "POST", body: { admissionNo, password } }),
      logout: () => request("/auth/logout", { method: "POST" }),
      getProfile: () => request("/student/profile"),
      getGrades: () => request("/student/grades"),
      getTimetable: () => request("/student/timetable"),
      getFees: () => request("/student/fees"),
      getAnnouncements: () => request("/student/announcements"),
      getDocuments: () => request("/student/documents"),
      getDashboard: () => request("/student/dashboard"),
      getToken,
      setToken,
      clearToken,
      getStoredStudent,
      setStoredStudent
    };
  })();

  /* ============================================================
     MOCK API — used only when CONFIG.USE_MOCK_API === true.
     Delete this whole block when switching to a real backend.
     ============================================================ */
  const MOCK_API = (function () {
    const MOCK_USER = {
      admissionNo: "DC/2025/001",
      password: "demo1234",
      student: {
        id: "DC-2025-001",
        admissionNo: "DC/2025/001",
        firstName: "Sarah",
        lastName: "Johnson",
        initials: "SJ",
        email: "sarah.johnson@student.damecooperinstitute.com",
        phone: "+64 21 234 5678",
        dateOfBirth: "2003-04-12",
        nationality: "New Zealand",
        programme: "BSc Computer Science",
        programmeCode: "BSC-CS",
        school: "School of Engineering",
        level: "Undergraduate — Year 2",
        studyMode: "On campus",
        startDate: "2024-02-26",
        expectedGraduation: "2027-11-30",
        advisor: "Dr. James Aroha",
        campus: "Dunedin Campus",
        photo: null
      }
    };

    const MOCK_GRADES = [
      { code: "CS201", title: "Data Structures & Algorithms", credits: 20, grade: "A",  points: 8 },
      { code: "CS210", title: "Operating Systems",             credits: 20, grade: "B+", points: 7 },
      { code: "MATH201", title: "Linear Algebra",              credits: 15, grade: "A-", points: 7 },
      { code: "CS220", title: "Database Systems",              credits: 20, grade: "A",  points: 8 },
      { code: "ENG205", title: "Technical Communication",      credits: 15, grade: "B",  points: 6 }
    ];

    const MOCK_TIMETABLE = {
      Monday: [
        { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
        { time: "11:00 – 12:30", title: "Operating Systems",            room: "B-105", lecturer: "Prof. L. Chen" },
        { time: "14:00 – 15:30", title: "Linear Algebra",                room: "A-310", lecturer: "Dr. M. Reid" }
      ],
      Tuesday: [
        { time: "10:00 – 11:30", title: "Database Systems",              room: "B-204", lecturer: "Dr. A. Patel" },
        { time: "13:00 – 14:30", title: "Technical Communication",       room: "C-102", lecturer: "Ms. H. Walker" }
      ],
      Wednesday: [
        { time: "09:00 – 10:30", title: "Data Structures & Algorithms", room: "B-201", lecturer: "Dr. K. Ngata" },
        { time: "15:00 – 16:30", title: "Operating Systems (Lab)",       room: "Lab 3", lecturer: "Prof. L. Chen" }
      ],
      Thursday: [
        { time: "09:00 – 10:30", title: "Database Systems",              room: "B-204", lecturer: "Dr. A. Patel" },
        { time: "11:00 – 12:30", title: "Linear Algebra",                room: "A-310", lecturer: "Dr. M. Reid" }
      ],
      Friday: [
        { time: "10:00 – 11:30", title: "Technical Communication",       room: "C-102", lecturer: "Ms. H. Walker" },
        { time: "14:00 – 17:00", title: "Project Workshop",              room: "Lab 1", lecturer: "Dr. K. Ngata" }
      ]
    };

    const MOCK_FEES = {
      currency: "NZD",
      total: 12800,
      paid: 9600,
      outstanding: 3200,
      items: [
        { id: "INV-2026-001", description: "Semester 1 tuition", amount: 6400, dueDate: "2026-02-20", status: "paid" },
        { id: "INV-2026-002", description: "Student services levy", amount: 700,  dueDate: "2026-02-20", status: "paid" },
        { id: "INV-2026-003", description: "Semester 2 tuition", amount: 5000, dueDate: "2026-07-15", status: "paid" },
        { id: "INV-2026-004", description: "Semester 2 tuition — remainder", amount: 3200, dueDate: "2026-07-15", status: "due" }
      ]
    };

    const MOCK_ANNOUNCEMENTS = [
      { id: 1, tag: "Academic",  date: "2026-04-10", title: "Semester 1 results released", body: "Your Semester 1 results are now available in the Grades section of the portal.", priority: "high" },
      { id: 2, tag: "Fees",      date: "2026-04-08", title: "Semester 2 payment reminder", body: "The remaining Semester 2 tuition balance is due by 15 July 2026.", priority: "medium" },
      { id: 3, tag: "Campus",    date: "2026-04-02", title: "Library extended hours", body: "The campus library will remain open until 10:00 PM during the examination period.", priority: "low" },
      { id: 4, tag: "Event",     date: "2026-03-28", title: "Careers Evening — 12 April", body: "Meet graduate employers from across New Zealand. Register via the Careers Services page.", priority: "medium" }
    ];

    const MOCK_DOCUMENTS = [
      { id: "doc-1", name: "Enrolment confirmation letter", size: "142 KB", type: "PDF", updatedAt: "2026-02-26" },
      { id: "doc-2", name: "Academic transcript",            size: "320 KB", type: "PDF", updatedAt: "2026-03-15" },
      { id: "doc-3", name: "Fees statement — Semester 1",    size: "88 KB",  type: "PDF", updatedAt: "2026-02-22" },
      { id: "doc-4", name: "Student ID card (reprint)",      size: "56 KB",  type: "PDF", updatedAt: "2025-08-10" },
      { id: "doc-5", name: "Programme handbook 2026",        size: "1.2 MB", type: "PDF", updatedAt: "2026-01-15" }
    ];

    function delay(ms) {
      return new Promise(function (r) { setTimeout(r, ms); });
    }

    async function handle(method, path, body) {
      await delay(420 + Math.random() * 280);

      // POST /auth/login
      if (method === "POST" && path === "/auth/login") {
        const { admissionNo, password } = body || {};
        if (!admissionNo || !password) {
          const err = new Error("Admission number and password are required.");
          err.status = 400; err.code = "VALIDATION_ERROR"; throw err;
        }
        if (
          admissionNo.trim().toUpperCase() !== MOCK_USER.admissionNo ||
          password !== MOCK_USER.password
        ) {
          const err = new Error("The admission number or password you entered is incorrect.");
          err.status = 401; err.code = "INVALID_CREDENTIALS"; throw err;
        }
        return {
          token: "mock-" + Math.random().toString(36).slice(2) + Date.now().toString(36),
          student: MOCK_USER.student
        };
      }

      if (method === "POST" && path === "/auth/logout") {
        return { ok: true };
      }

      // Ensure an authenticated session exists for the rest
      if (!API.getToken()) {
        const err = new Error("Your session has expired. Please sign in again.");
        err.status = 401; err.code = "UNAUTHENTICATED"; throw err;
      }

      if (method === "GET" && path === "/student/profile")        return MOCK_USER.student;
      if (method === "GET" && path === "/student/grades")         return { grades: MOCK_GRADES };
      if (method === "GET" && path === "/student/timetable")      return { days: MOCK_TIMETABLE };
      if (method === "GET" && path === "/student/fees")           return MOCK_FEES;
      if (method === "GET" && path === "/student/announcements")  return { announcements: MOCK_ANNOUNCEMENTS };
      if (method === "GET" && path === "/student/documents")      return { documents: MOCK_DOCUMENTS };

      if (method === "GET" && path === "/student/dashboard") {
        return {
          stats: {
            gpa: "7.2",
            creditsThisYear: 90,
            outstandingFees: MOCK_FEES.outstanding,
            currency: MOCK_FEES.currency,
            attendancePercent: 94
          },
          announcements: MOCK_ANNOUNCEMENTS.slice(0, 3),
          todayClasses: getTodayClasses()
        };
      }

      const err = new Error("Not found: " + method + " " + path);
      err.status = 404; err.code = "NOT_FOUND"; throw err;
    }

    function getTodayClasses() {
      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const today = dayNames[new Date().getDay()];
      return MOCK_TIMETABLE[today] || [];
    }

    return { handle };
  })();

  /* ============================================================
     APP — UI ORCHESTRATION
     ============================================================ */
  const App = (function () {
    const state = {
      student: null,
      dashboard: null,
      cache: { grades: null, timetable: null, fees: null, announcements: null, documents: null }
    };

    // ---- DOM refs
    const el = {
      loginView: document.getElementById("loginView"),
      portalView: document.getElementById("portalView"),
      loginForm: document.getElementById("loginForm"),
      loginBtn: document.getElementById("loginBtn"),
      admissionNo: document.getElementById("admissionNo"),
      password: document.getElementById("password"),
      togglePassword: document.getElementById("togglePassword"),
      authMessage: document.getElementById("authMessage"),
      authMessageText: document.getElementById("authMessageText"),
      forgotLink: document.getElementById("forgotLink"),
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
      loginYear: document.getElementById("loginYear")
    };

    const SECTION_TITLES = {
      dashboard: "Dashboard",
      profile: "My Profile",
      grades: "Grades",
      timetable: "Timetable",
      fees: "Fees & Payments",
      announcements: "Announcements",
      documents: "Documents"
    };

    // ---- Utility
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

    function showAuthMessage(kind, text) {
      el.authMessage.className = "auth-message show " + kind;
      el.authMessageText.textContent = text;
      const icon = el.authMessage.querySelector("i");
      if (icon) {
        icon.className = "fas " + (
          kind === "error" ? "fa-circle-exclamation" :
          kind === "success" ? "fa-circle-check" :
          "fa-circle-info"
        );
      }
    }

    function clearAuthMessage() {
      el.authMessage.className = "auth-message";
      el.authMessageText.textContent = "";
    }

    function setLoading(button, loadingText) {
      if (!button) return;
      if (button.dataset.originalHtml === undefined) {
        button.dataset.originalHtml = button.innerHTML;
      }
      if (loadingText) {
        button.disabled = true;
        button.innerHTML = escapeHTML(loadingText) + ' <i class="fas fa-circle-notch" aria-hidden="true"></i>';
      } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml;
      }
    }

    // ---- Session boot
    function boot() {
      el.loginYear.textContent = new Date().getFullYear();

      if (API.getToken()) {
        const stored = API.getStoredStudent();
        if (stored) {
          state.student = stored;
          enterPortal();
          return;
        }
      }
      showLogin();
    }

    function showLogin() {
      el.portalView.classList.remove("active");
      el.loginView.style.display = "";
    }

    function enterPortal() {
      el.loginView.style.display = "none";
      el.portalView.classList.add("active");
      hydrateHeader();
      loadDashboard();
    }

    function hydrateHeader() {
      const s = state.student;
      if (!s) return;
      el.headerName.textContent = s.firstName + " " + s.lastName;
      el.headerAdm.textContent = s.admissionNo;
      el.userAvatar.textContent = s.initials || (s.firstName[0] + s.lastName[0]);
    }

    // ---- Login / logout
    async function handleLogin(e) {
      e.preventDefault();
      clearAuthMessage();

      const admissionNo = el.admissionNo.value.trim();
      const password = el.password.value;

      if (!admissionNo) {
        showAuthMessage("error", "Please enter your admission number.");
        el.admissionNo.focus();
        return;
      }
      if (!password) {
        showAuthMessage("error", "Please enter your password.");
        el.password.focus();
        return;
      }

      setLoading(el.loginBtn, "Signing in");

      try {
        const res = await API.login(admissionNo, password);
        API.setToken(res.token);
        API.setStoredStudent(res.student);
        state.student = res.student;

        showAuthMessage("success", "Welcome back, " + res.student.firstName + ".");
        setTimeout(function () {
          clearAuthMessage();
          el.loginForm.reset();
          enterPortal();
        }, 400);
      } catch (err) {
        showAuthMessage("error", err.message || "Sign-in failed. Please try again.");
        el.password.value = "";
      } finally {
        setLoading(el.loginBtn, null);
      }
    }

    async function handleLogout() {
      try { await API.logout(); } catch { /* ignore */ }
      API.clearToken();
      state.student = null;
      state.cache = { grades: null, timetable: null, fees: null, announcements: null, documents: null };
      el.loginView.style.display = "";
      el.portalView.classList.remove("active");
      toast("You have been signed out.", "info");
    }

    // ---- Section navigation
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
      document.title = (SECTION_TITLES[sectionId] || "Dashboard") + " | DameCooper Student Portal";
      closeDrawer();
      window.scrollTo({ top: 0, behavior: "smooth" });

      loadSection(sectionId);
    }

    function loadSection(sectionId) {
      if (sectionId === "dashboard")     loadDashboard();
      if (sectionId === "profile")       loadProfile();
      if (sectionId === "grades")        loadGrades();
      if (sectionId === "timetable")     loadTimetable();
      if (sectionId === "fees")          loadFees();
      if (sectionId === "announcements") loadAnnouncements();
      if (sectionId === "documents")     loadDocuments();
    }

    // ---- Loaders
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
      grid.innerHTML =
        statCard("fa-chart-line", "Current GPA", stats.gpa, "Up from 6.9 last semester") +
        statCard("fa-book", "Credits this year", stats.creditsThisYear, "Across 5 courses") +
        statCard("fa-receipt", "Outstanding fees", stats.currency + " " + Number(stats.outstandingFees).toLocaleString(), "Due by 15 July") +
        statCard("fa-calendar-check", "Attendance", stats.attendancePercent + "%", "Excellent standing");
    }

    function statCard(icon, label, value, delta) {
      return (
        '<div class="stat-card">' +
          '<div class="stat-icon"><i class="fas ' + icon + '" aria-hidden="true"></i></div>' +
          '<div class="stat-label">' + escapeHTML(label) + '</div>' +
          '<div class="stat-value">' + escapeHTML(value) + '</div>' +
          (delta ? '<div class="stat-delta"><i class="fas fa-arrow-trend-up" aria-hidden="true"></i>' + escapeHTML(delta) + '</div>' : '') +
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
                '<div class="announcement-meta"><span class="tag">' + escapeHTML(a.tag) + '</span><span>' + escapeHTML(a.date) + '</span></div>' +
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
        body.innerHTML = emptyState("fa-mug-hot", "No classes today", "Enjoy the break — check your full timetable for the week.");
        return;
      }
      body.innerHTML = classes.map(function (c) {
        return (
          '<div class="class-slot">' +
            '<div class="class-time">' + escapeHTML(c.time) + '</div>' +
            '<div class="class-info"><h5>' + escapeHTML(c.title) + '</h5><span>' + escapeHTML(c.lecturer || "") + '</span></div>' +
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
            fieldBlock("Full name", s.firstName + " " + s.lastName) +
            fieldBlock("Admission number", s.admissionNo) +
            fieldBlock("Email", s.email) +
            fieldBlock("Phone", s.phone) +
            fieldBlock("Date of birth", s.dateOfBirth) +
            fieldBlock("Nationality", s.nationality) +
            fieldBlock("Programme", s.programme + " (" + s.programmeCode + ")") +
            fieldBlock("School", s.school) +
            fieldBlock("Level", s.level) +
            fieldBlock("Study mode", s.studyMode) +
            fieldBlock("Academic advisor", s.advisor) +
            fieldBlock("Campus", s.campus) +
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
          body.innerHTML = emptyState("fa-graduation-cap", "No grades yet", "Your results will appear here once they are released.");
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
                    '<td><strong>' + escapeHTML(g.title) + '</strong><span class="grade-code">' + escapeHTML(g.code) + '</span></td>' +
                    '<td>' + escapeHTML(g.credits) + '</td>' +
                    '<td><span class="grade-badge ' + cls + '">' + escapeHTML(g.grade) + '</span></td>' +
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
                      '<div class="class-info"><h5>' + escapeHTML(c.title) + '</h5><span>' + escapeHTML(c.lecturer || "") + '</span></div>' +
                      '<div class="class-room">' + escapeHTML(c.room) + '</div>' +
                    '</div>'
                  );
                }).join("") +
              '</div>'
            );
          }).join("");

        body.innerHTML = html || emptyState("fa-calendar-days", "No timetable available", "Your schedule has not been published yet.");
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
            '<div class="fee-box"><div class="fee-box-label">Total fees</div><div class="fee-box-value">' + currency + ' ' + Number(f.total).toLocaleString() + '</div></div>' +
            '<div class="fee-box paid"><div class="fee-box-label">Paid to date</div><div class="fee-box-value">' + currency + ' ' + Number(f.paid).toLocaleString() + '</div></div>' +
            '<div class="fee-box due"><div class="fee-box-label">Outstanding</div><div class="fee-box-value">' + currency + ' ' + Number(f.outstanding).toLocaleString() + '</div></div>' +
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
                        '<td>' + escapeHTML(item.id) + '</td>' +
                        '<td>' + escapeHTML(item.description) + '</td>' +
                        '<td>' + currency + ' ' + Number(item.amount).toLocaleString() + '</td>' +
                        '<td>' + escapeHTML(item.dueDate) + '</td>' +
                        '<td><span class="fee-status ' + cls + '"><i class="fas ' + (cls === "paid" ? "fa-check" : "fa-clock") + '" aria-hidden="true"></i>' + label + '</span></td>' +
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
        if (!state.cache.announcements) state.cache.announcements = await API.getAnnouncements();
        const items = state.cache.announcements.announcements || [];
        if (!items.length) {
          body.innerHTML = emptyState("fa-bullhorn", "No announcements", "There are no announcements to display.");
          return;
        }
        body.innerHTML = '<div class="announcement-list">' +
          items.map(function (a) {
            return (
              '<div class="announcement">' +
                '<span class="announcement-icon"><i class="fas fa-bullhorn" aria-hidden="true"></i></span>' +
                '<div class="announcement-body">' +
                  '<div class="announcement-meta"><span class="tag">' + escapeHTML(a.tag) + '</span><span>' + escapeHTML(a.date) + '</span></div>' +
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
          body.innerHTML = emptyState("fa-folder-open", "No documents", "There are no documents available for download yet.");
          return;
        }
        body.innerHTML = items.map(function (d) {
          return (
            '<a class="doc-card" href="#" data-doc="' + escapeHTML(d.id) + '">' +
              '<span class="doc-icon"><i class="fas fa-file-pdf" aria-hidden="true"></i></span>' +
              '<span class="doc-meta"><strong>' + escapeHTML(d.name) + '</strong><span>' + escapeHTML(d.type) + ' · ' + escapeHTML(d.size) + ' · Updated ' + escapeHTML(d.updatedAt) + '</span></span>' +
            '</a>'
          );
        }).join("");

        body.querySelectorAll("[data-doc]").forEach(function (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            toast("Download will be available once connected to the Institute document service.", "info");
          });
        });
      } catch (err) {
        body.innerHTML = errorState(err);
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
        state.student = null;
        showLogin();
        toast("Your session has expired. Please sign in again.", "error");
        return;
      }
      toast((err && err.message) || "Something went wrong.", "error");
    }

    // ---- Drawer (mobile)
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

    // ---- Wire up
    function bind() {
      el.loginForm.addEventListener("submit", handleLogin);

      el.togglePassword.addEventListener("click", function () {
        const isPassword = el.password.type === "password";
        el.password.type = isPassword ? "text" : "password";
        this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
        this.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
        el.password.focus();
      });

      el.forgotLink.addEventListener("click", function (e) {
        e.preventDefault();
        showAuthMessage("info", "Please contact student support on +64 3 479 8900 to reset your password.");
      });

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

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeDrawer();
      });

      // Session-expiry check on focus
      window.addEventListener("focus", function () {
        if (state.student && !API.getToken()) {
          handleApiError({ status: 401, message: "Session expired." });
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