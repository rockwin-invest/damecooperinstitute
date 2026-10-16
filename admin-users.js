/* ============================================================
   DAMECOOPER INSTITUTE — ADMIN USER MANAGEMENT
   ------------------------------------------------------------
   Behind the sign-in gate. Admin-only. Reads/writes real users
   via /api/admin/*. No mock store.
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
    logout:           () => request("/auth/logout", { method: "POST" }),
    listUsers:        () => request("/admin/users"),
    createUser:       (payload) => request("/admin/users", { method: "POST", body: payload }),
    resendInvite:     (id) => request("/admin/users/" + id + "/resend-invite", { method: "POST" }),
    toggleStatus:     (id) => request("/admin/users/" + id + "/status", { method: "PATCH" }),
    getToken,
    clearToken
  };
})();

/* ============================================================
   PAGE GUARD — admin only
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
   UI HELPERS
   ============================================================ */
const dom = {
  tbody:            document.getElementById("usersTbody"),
  emptyState:       document.getElementById("emptyState"),
  search:           document.getElementById("searchInput"),
  roleFilter:       document.getElementById("roleFilter"),
  statusFilter:     document.getElementById("statusFilter"),
  createBtn:        document.getElementById("createUserBtn"),
  createModal:      document.getElementById("createModal"),
  createClose:      document.getElementById("createClose"),
  createCancel:     document.getElementById("createCancel"),
  createForm:       document.getElementById("createForm"),
  createSubmit:     document.getElementById("createSubmit"),
  createMsg:        document.getElementById("createMsg"),
  createMsgText:    document.getElementById("createMsgText"),
  newRole:          document.getElementById("newRole"),
  adminConfirmField: document.getElementById("adminConfirmField"),
  adminConfirm:     document.getElementById("adminConfirm"),
  programmeField:   document.getElementById("programmeField"),
  newProgramme:     document.getElementById("newProgramme"),
  sidebar:          document.getElementById("sidebar"),
  menuBtn:          document.getElementById("menuBtn"),
  drawerOverlay:    document.getElementById("drawerOverlay"),
  toastStack:       document.getElementById("toastStack"),
  logoutBtn:        document.getElementById("logoutBtn")
};

function escapeHTML(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(first, last) {
  return ((first || "").charAt(0) + (last || "").charAt(0)).toUpperCase() || "??";
}

function toast(message, kind) {
  kind = kind || "info";
  const iconMap = { info: "fa-circle-info", success: "fa-circle-check", error: "fa-circle-exclamation" };
  const node = document.createElement("div");
  node.className = "toast " + kind;
  node.innerHTML =
    '<i class="fas ' + (iconMap[kind] || iconMap.info) + '" aria-hidden="true"></i>' +
    '<span>' + escapeHTML(message) + '</span>';
  dom.toastStack.appendChild(node);
  setTimeout(function () {
    node.style.opacity = "0";
    node.style.transform = "translateY(10px)";
    node.style.transition = "all 0.3s ease";
    setTimeout(function () { node.remove(); }, 300);
  }, 4000);
}

function showCreateMessage(kind, text) {
  dom.createMsg.className = "msg show " + kind;
  dom.createMsgText.textContent = text;
  const icon = dom.createMsg.querySelector("i");
  icon.className = "fas " + (
    kind === "error" ? "fa-circle-exclamation" :
    kind === "success" ? "fa-circle-check" :
    "fa-circle-info"
  );
}

function clearCreateMessage() {
  dom.createMsg.className = "msg";
  dom.createMsgText.textContent = "";
}

function setLoading(button, isLoading, label) {
  if (!button) return;
  if (button.dataset.originalHtml === undefined) {
    button.dataset.originalHtml = button.innerHTML;
  }
  if (isLoading) {
    button.disabled = true;
    button.innerHTML =
      (label || "Please wait") + ' <i class="fas fa-circle-notch" aria-hidden="true"></i>';
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalHtml;
  }
}

function roleLabel(role) {
  return ({
    student: "Student",
    staff: "Staff",
    admin: "Admin",
    applicant: "Applicant"
  })[role] || role;
}

function statusLabel(status) {
  return ({
    active: "Active",
    pending: "Pending",
    suspended: "Suspended"
  })[status] || status;
}

/* ============================================================
   RENDERING
   ============================================================ */
let allUsers = [];

function renderUsers() {
  const query = dom.search.value.trim().toLowerCase();
  const roleFilter = dom.roleFilter.value;
  const statusFilter = dom.statusFilter.value;

  const filtered = allUsers.filter(function (u) {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (!query) return true;
    const haystack = (
      (u.firstName || "") + " " +
      (u.lastName || "") + " " +
      (u.loginId || "") + " " +
      (u.email || "")
    ).toLowerCase();
    return haystack.includes(query);
  });

  if (!filtered.length) {
    dom.tbody.innerHTML = "";
    dom.emptyState.style.display = "";
    return;
  }
  dom.emptyState.style.display = "none";

  dom.tbody.innerHTML = filtered.map(function (u) {
    const canResend = u.status === "pending";
    const isSuspended = u.status === "suspended";
    return (
      '<tr>' +
        '<td>' +
          '<div class="user-cell">' +
            '<span class="user-avatar">' + escapeHTML(initials(u.firstName, u.lastName)) + '</span>' +
            '<span class="user-cell-meta">' +
              '<strong>' + escapeHTML((u.firstName || "") + " " + (u.lastName || "")) + '</strong>' +
              '<span>' + escapeHTML(u.email || "—") + '</span>' +
            '</span>' +
          '</div>' +
        '</td>' +
        '<td><code style="font-family:monospace;font-size:0.8125rem;">' + escapeHTML(u.loginId || "—") + '</code></td>' +
        '<td><span class="role-badge role-' + escapeHTML(u.role) + '">' + escapeHTML(roleLabel(u.role)) + '</span></td>' +
        '<td><span class="status-badge status-' + escapeHTML(u.status) + '">' + escapeHTML(statusLabel(u.status)) + '</span></td>' +
        '<td style="color:var(--text-secondary);font-size:0.8125rem;">' + escapeHTML(u.lastLogin || "—") + '</td>' +
        '<td>' +
          '<div class="row-actions">' +
            (canResend
              ? '<button class="icon-btn" data-action="resend" data-id="' + escapeHTML(u.id) + '" title="Resend invitation" aria-label="Resend invitation"><i class="fas fa-paper-plane"></i></button>'
              : '') +
            '<button class="icon-btn ' + (isSuspended ? "" : "danger") + '" data-action="toggle" data-id="' + escapeHTML(u.id) + '" title="' + (isSuspended ? "Reactivate account" : "Suspend account") + '" aria-label="' + (isSuspended ? "Reactivate" : "Suspend") + '">' +
              '<i class="fas ' + (isSuspended ? "fa-unlock" : "fa-lock") + '"></i>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join("");
}

/* ============================================================
   LOAD USERS
   ============================================================ */
async function loadUsers() {
  try {
    const data = await API.listUsers();
    allUsers = data.users || [];
    renderUsers();
  } catch (err) {
    if (err && err.status === 401) {
      API.clearToken();
      window.location.replace("signin.html");
      return;
    }
    dom.tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty-state">' +
        '<i class="fas fa-triangle-exclamation"></i>' +
        '<h4>We couldn\'t load the user list</h4>' +
        '<p>' + escapeHTML(err.message || "Please try again.") + '</p>' +
      '</div></td></tr>';
  }
}

/* ============================================================
   CREATE USER
   ============================================================ */
function openCreateModal() {
  dom.createModal.classList.add("show");
  dom.createModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  clearCreateMessage();
  dom.createForm.reset();
  updateRoleFields();
  setTimeout(function () {
    document.getElementById("newFirstName").focus();
  }, 50);
}

function closeCreateModal() {
  dom.createModal.classList.remove("show");
  dom.createModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function updateRoleFields() {
  const role = dom.newRole.value;
  const isAdmin = role === "admin";
  const isStudent = role === "student";

  dom.adminConfirmField.style.display = isAdmin ? "" : "none";
  dom.programmeField.style.display = isStudent ? "" : "none";

  if (isAdmin) {
    dom.adminConfirm.setAttribute("required", "");
  } else {
    dom.adminConfirm.removeAttribute("required");
    dom.adminConfirm.value = "";
  }
  if (isStudent) {
    dom.newProgramme.setAttribute("required", "");
  } else {
    dom.newProgramme.removeAttribute("required");
    dom.newProgramme.value = "";
  }
}

async function handleCreateSubmit(e) {
  e.preventDefault();
  clearCreateMessage();

  const payload = {
    firstName: document.getElementById("newFirstName").value.trim(),
    lastName:  document.getElementById("newLastName").value.trim(),
    email:     document.getElementById("newEmail").value.trim(),
    loginId:   document.getElementById("newLoginId").value.trim().toUpperCase(),
    role:      document.getElementById("newRole").value,
    programme: dom.newProgramme.value.trim() || null,
    adminConfirm: dom.adminConfirm.value.trim() || null
  };

  if (!payload.firstName || !payload.lastName) {
    showCreateMessage("error", "First name and last name are required.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
    showCreateMessage("error", "Please enter a valid email address.");
    return;
  }
  if (!payload.loginId) {
    showCreateMessage("error", "Login ID is required.");
    return;
  }
  if (!payload.role) {
    showCreateMessage("error", "Please select a role.");
    return;
  }
  if (payload.role === "admin" && !payload.adminConfirm) {
    showCreateMessage("error", "Administrator accounts require a confirmation code.");
    return;
  }

  setLoading(dom.createSubmit, true, "Creating");

  try {
    await API.createUser(payload);
    showCreateMessage(
      "success",
      "Account created. An invitation email is on its way to " + payload.email + "."
    );
    toast("Account created — invitation sent.", "success");
    setTimeout(function () {
      closeCreateModal();
      loadUsers();
    }, 1200);
  } catch (err) {
    showCreateMessage("error", err.message || "Could not create account.");
    setLoading(dom.createSubmit, false);
  }
}

/* ============================================================
   ROW ACTIONS
   ============================================================ */
async function handleRowAction(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "resend") {
    btn.disabled = true;
    try {
      await API.resendInvite(id);
      toast("Invitation resent.", "success");
    } catch (err) {
      toast(err.message || "Could not resend invitation.", "error");
    } finally {
      btn.disabled = false;
    }
    return;
  }

  if (action === "toggle") {
    btn.disabled = true;
    try {
      const updated = await API.toggleStatus(id);
      const idx = allUsers.findIndex(function (u) { return u.id === id; });
      if (idx >= 0) {
        if (updated && updated.id) {
          allUsers[idx] = Object.assign({}, allUsers[idx], {
            status: updated.status
          });
        } else {
          allUsers[idx].status =
            allUsers[idx].status === "suspended" ? "active" : "suspended";
        }
      }
      renderUsers();
      toast("Status updated.", "success");
    } catch (err) {
      toast(err.message || "Could not update status.", "error");
    } finally {
      btn.disabled = false;
    }
  }
}

/* ============================================================
   MOBILE DRAWER
   ============================================================ */
function openDrawer() {
  dom.sidebar.classList.add("open");
  dom.drawerOverlay.classList.add("active");
  dom.menuBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  dom.sidebar.classList.remove("open");
  dom.drawerOverlay.classList.remove("active");
  dom.menuBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

/* ============================================================
   SIGN OUT
   ============================================================ */
async function handleLogout() {
  try { await API.logout(); } catch (_) { /* ignore */ }
  API.clearToken();
  window.location.replace("signin.html");
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  loadUsers();

  dom.search.addEventListener("input", renderUsers);
  dom.roleFilter.addEventListener("change", renderUsers);
  dom.statusFilter.addEventListener("change", renderUsers);

  dom.createBtn.addEventListener("click", openCreateModal);
  dom.createClose.addEventListener("click", closeCreateModal);
  dom.createCancel.addEventListener("click", closeCreateModal);
  dom.createModal.addEventListener("click", function (e) {
    if (e.target === dom.createModal) closeCreateModal();
  });
  dom.newRole.addEventListener("change", updateRoleFields);
  dom.createForm.addEventListener("submit", handleCreateSubmit);

  dom.tbody.addEventListener("click", handleRowAction);

  dom.menuBtn.addEventListener("click", openDrawer);
  dom.drawerOverlay.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (dom.createModal.classList.contains("show")) closeCreateModal();
      closeDrawer();
    }
  });

  dom.logoutBtn.addEventListener("click", handleLogout);
});