/* ============================================================
   DAMECOOPER INSTITUTE — ADMIN PORTAL
   ------------------------------------------------------------
   Behind the single sign-in gate at signin.html. Role-guarded
   to admin only. Dashboard stats come from /api/admin/stats.
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
    getStats:     () => request("/admin/stats"),
    getUsers:     () => request("/admin/users"),
    getHealth:    () => request("/health"),
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
  if (role && role !== "admin") {
    window.location.replace(ROLE_ROUTES[role] || "signin.html");
  }
})();

/* ============================================================
   APP
   ============================================================ */
const App = (function () {
  const state = {
    user: null,
    stats: null,
    users: null
  };

  const el = {
    sidebar: document.getElementById("sidebar"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    menuBtn: document.getElementById("menuBtn"),
    headerName: document.getElementById("headerName"),
    headerId: document.getElementById("headerId"),
    userAvatar: document.getElementById("userAvatar"),
    userChip: document.getElementById("userChip"),
    logoutBtn: document.getElementById("logoutBtn"),
    statGrid: document.getElementById("statGrid"),
    activityFeed: document.getElementById("activityFeed"),
    healthList: document.getElementById("healthList"),
    notifBadge: document.getElementById("notifBadge"),
    toastStack: document.getElementById("toastStack")
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
    loadStats();
    loadUsers();
    loadHealth();
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
  }

  /* ------------------ Logout ------------------ */
  async function handleLogout() {
    try { await API.logout(); } catch (_) { /* ignore */ }
    API.clearToken();
    window.location.replace("signin.html");
  }

  /* ------------------ Stats ------------------ */
  async function loadStats() {
    try {
      state.stats = await API.getStats();
      renderStats(state.stats);
    } catch (err) {
      handleApiError(err);
      if (el.statGrid) el.statGrid.innerHTML = errorState(err);
    }
  }

  function renderStats(stats) {
    if (!el.statGrid) return;
    el.statGrid.innerHTML =
      statCard("fa-users", "Total accounts", stats.total, "All roles") +
      statCard("fa-user-graduate", "Active students", stats.students, "Across all schools") +
      statCard("fa-user-tie", "Staff & faculty", stats.staff, "Active this semester") +
      statCard("fa-envelope", "Pending invitations", stats.pendingInvites, "Awaiting response");

    if (el.notifBadge) {
      el.notifBadge.textContent = String(stats.pendingInvites || 0);
    }
  }

  function statCard(icon, label, value, delta) {
    return (
      '<div class="stat-card">' +
        '<div class="stat-icon"><i class="fas ' + icon + '" aria-hidden="true"></i></div>' +
        '<div class="stat-label">' + escapeHTML(label) + '</div>' +
        '<div class="stat-value">' + escapeHTML(value == null ? "—" : Number(value).toLocaleString()) + '</div>' +
        (delta ? '<div class="stat-delta">' + escapeHTML(delta) + '</div>' : '') +
      '</div>'
    );
  }

  /* ------------------ Recent users ------------------ */
  async function loadUsers() {
    if (!el.activityFeed) return;
    try {
      state.users = await API.getUsers();
      renderRecentUsers((state.users.users || []).slice(0, 5));
    } catch (err) {
      if (err && err.status === 401) {
        handleApiError(err);
        return;
      }
      el.activityFeed.innerHTML = errorState(err);
    }
  }

  function renderRecentUsers(users) {
    if (!users.length) {
      el.activityFeed.innerHTML = emptyState("fa-users", "No accounts yet",
        "New accounts will appear here as they're created.");
      return;
    }

    const iconFor = function (u) {
      if (u.status === "pending") return "fa-paper-plane";
      if (u.status === "suspended") return "fa-lock";
      return "fa-user-plus";
    };
    const labelFor = function (u) {
      if (u.status === "pending") return "Invitation sent";
      if (u.status === "suspended") return "Account suspended";
      return "Account active";
    };

    el.activityFeed.innerHTML = users.map(function (u) {
      const name = ((u.firstName || "") + " " + (u.lastName || "")).trim() || u.loginId;
      const role = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User";
      return (
        '<div class="activity-item">' +
          '<span class="activity-icon"><i class="fas ' + iconFor(u) + '" aria-hidden="true"></i></span>' +
          '<div class="activity-body">' +
            '<p><strong>' + escapeHTML(labelFor(u)) + '</strong> — ' +
              escapeHTML(name) + ' (' + escapeHTML(u.loginId) + ')</p>' +
            '<time>' + escapeHTML(role) + ' · last login ' + escapeHTML(u.lastLogin || "—") + '</time>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  /* ------------------ System health ------------------ */
  async function loadHealth() {
    if (!el.healthList) return;
    try {
      const health = await API.getHealth();
      const dbOk = health.db === "connected";

      el.healthList.innerHTML =
        healthRow("ok", "API service", "Operational") +
        healthRow(dbOk ? "ok" : "warn", "Database",
          dbOk ? "Connected" : "Disconnected") +
        healthRow("ok", "Authentication", "Operational") +
        healthRow("ok", "Document storage", "Local — ephemeral on Render");
    } catch (err) {
      el.healthList.innerHTML = errorState(err);
    }
  }

  function healthRow(status, label, detail) {
    return (
      '<div class="health-row">' +
        '<span class="health-dot ' + status + '"></span>' +
        '<strong>' + escapeHTML(label) + '</strong>' +
        '<span>' + escapeHTML(detail) + '</span>' +
      '</div>'
    );
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

    if (el.userChip) {
      el.userChip.addEventListener("click", function () {
        window.location.href = "admin-users.html";
      });
    }

    el.menuBtn.addEventListener("click", openDrawer);
    el.drawerOverlay.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    // Placeholder sidebar links
    document.querySelectorAll(".sidebar-nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#") {
        link.addEventListener("click", function (e) {
          e.preventDefault();
        });
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