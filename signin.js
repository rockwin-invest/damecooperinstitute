/* ============================================================
   DAMECOOPER INSTITUTE — SIGN-IN
   ------------------------------------------------------------
   One sign-in page for all roles. The backend is the sole
   authority on what a user is; the frontend simply obeys the
   role it returns and redirects to the correct portal.

   The user never chooses their own role.
   ============================================================ */

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  API_BASE_URL: "https://damecooperinstitute.onrender.com/api/auth/signin",
  FORGOT_API_BASE_URL: "https://damecooperinstitute.onrender.com/api/auth/forgot-password",
  SESSION_STORAGE_KEY: "dc_portal_token",
  ROLE_STORAGE_KEY: "dc_portal_role",
  STUDENT_STORAGE_KEY: "dc_portal_student"
};

/* Where each role lands after a successful sign-in. */
const ROLE_ROUTES = {
  student: "student-portal.html",
  staff:   "staff-portal.html",
  admin:   "admin-portal.html"
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const dom = {
  form: document.getElementById("signinForm"),
  loginId: document.getElementById("loginId"),
  password: document.getElementById("password"),
  rememberMe: document.getElementById("rememberMe"),
  togglePassword: document.getElementById("togglePassword"),
  signinBtn: document.getElementById("signinBtn"),
  loginIdError: document.getElementById("loginIdError"),
  passwordError: document.getElementById("passwordError"),
  authMessage: document.getElementById("authMessage"),
  authMessageIcon: document.getElementById("authMessageIcon"),
  authMessageText: document.getElementById("authMessageText"),
  forgotLink: document.getElementById("forgotLink"),
  forgotModal: document.getElementById("forgotModal"),
  forgotClose: document.getElementById("forgotClose"),
  forgotForm: document.getElementById("forgotForm"),
  resetEmail: document.getElementById("resetEmail"),
  resetEmailError: document.getElementById("resetEmailError"),
  resetBtn: document.getElementById("resetBtn"),
  year: document.getElementById("year")
};

/* ============================================================
   UI HELPERS
   ============================================================ */
function showMessage(kind, text) {
  dom.authMessage.className = "auth-message show " + kind;
  dom.authMessageText.textContent = text;
  dom.authMessageIcon.className = "fas " + (
    kind === "error" ? "fa-circle-exclamation" :
    kind === "success" ? "fa-circle-check" :
    "fa-circle-info"
  );
}

function clearMessage() {
  dom.authMessage.className = "auth-message";
  dom.authMessageText.textContent = "";
}

function setFieldError(field, errorEl, message) {
  if (message) {
    field.classList.add("invalid");
    field.setAttribute("aria-invalid", "true");
    if (errorEl) {
      errorEl.querySelector("span").textContent = message;
      errorEl.classList.add("show");
    }
  } else {
    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
    if (errorEl) errorEl.classList.remove("show");
  }
}

function setLoading(button, isLoading, loadingLabel) {
  if (!button) return;
  if (button.dataset.originalHtml === undefined) {
    button.dataset.originalHtml = button.innerHTML;
  }
  if (isLoading) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML =
      (loadingLabel || "Please wait") +
      ' <i class="fas fa-circle-notch" aria-hidden="true"></i>';
  } else {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = button.dataset.originalHtml;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validateSigninForm() {
  let valid = true;

  const loginId = dom.loginId.value.trim();
  if (!loginId) {
    setFieldError(dom.loginId, dom.loginIdError, "Please enter your DameCooper ID.");
    valid = false;
  } else if (loginId.length < 4) {
    setFieldError(dom.loginId, dom.loginIdError, "That ID looks too short.");
    valid = false;
  } else {
    setFieldError(dom.loginId, dom.loginIdError, null);
  }

  const password = dom.password.value;
  if (!password) {
    setFieldError(dom.password, dom.passwordError, "Please enter your password.");
    valid = false;
  } else if (password.length < 6) {
    setFieldError(dom.password, dom.passwordError, "Passwords are at least 6 characters.");
    valid = false;
  } else {
    setFieldError(dom.password, dom.passwordError, null);
  }

  return valid;
}

/* ============================================================
   ROLE ROUTING
   ------------------------------------------------------------
   The frontend obeys the backend's decision. It never decides
   the role itself.
   ============================================================ */
function redirectByRole(role) {
  const destination = ROLE_ROUTES[role];

  if (!destination) {
    showMessage(
      "error",
      "Your account has an unrecognised role. Please contact the IT Service Desk."
    );
    return false;
  }

  // Persist role so the destination portal can guard itself.
  try {
    sessionStorage.setItem(CONFIG.ROLE_STORAGE_KEY, role);
  } catch (_) { /* ignore */ }

  showMessage("success", "Signed in. Redirecting…");
  setTimeout(function () {
    window.location.href = destination;
  }, 650);

  return true;
}

/* ============================================================
   SIGN-IN HANDLER
   ============================================================ */
async function handleSignin(e) {
  e.preventDefault();
  clearMessage();

  if (!validateSigninForm()) {
    const firstInvalid = dom.form.querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const payload = {
    loginId: dom.loginId.value.trim(),
    password: dom.password.value,
    rememberMe: dom.rememberMe.checked
  };

  setLoading(dom.signinBtn, true, "Signing in");
  dom.loginId.disabled = true;
  dom.password.disabled = true;

  try {
    const res = await fetch(CONFIG.API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data = null;
    try { data = await res.json(); } catch (_) { /* empty body */ }

    if (!res.ok) {
      const code = (data && data.code) || "";
      let msg = (data && data.message) || "Sign-in failed. Please try again.";

      if (code === "INVALID_CREDENTIALS" || res.status === 401) {
        msg = "The DameCooper ID or password you entered is incorrect.";
      } else if (code === "ACCOUNT_SUSPENDED" || res.status === 403) {
        msg = "Your account is suspended. Please contact the IT Service Desk.";
      } else if (code === "RATE_LIMITED" || res.status === 429) {
        msg = "Too many attempts. Please wait a few minutes and try again.";
      } else if (res.status >= 500) {
        msg = "We're having trouble signing you in right now. Please try again shortly.";
      }

      showMessage("error", msg);
      dom.password.value = "";
      dom.password.focus();
      return;
    }

    // ---- Success: persist session, then route by role ----
    const user = data && data.user;
    const role = user && user.role;

    if (!data || !data.token || !role) {
      showMessage(
        "error",
        "We received an unexpected response from the server. Please contact the IT Service Desk."
      );
      return;
    }

    persistSession(data.token, payload.rememberMe);

    try {
      sessionStorage.setItem(CONFIG.STUDENT_STORAGE_KEY, JSON.stringify(user));
    } catch (_) { /* ignore */ }

    redirectByRole(role);

  } catch (err) {
    showMessage(
      "error",
      "We couldn't reach the server. Please check your connection and try again."
    );
  } finally {
    setLoading(dom.signinBtn, false);
    dom.loginId.disabled = false;
    dom.password.disabled = false;
  }
}

function persistSession(token, remember) {
  try {
    const storage = remember ? localStorage : sessionStorage;
    // Clear from the other storage to avoid a stale session winning.
    if (remember) {
      sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    } else {
      localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    }
    storage.setItem(CONFIG.SESSION_STORAGE_KEY, token);
  } catch (_) { /* ignore */ }
}

/* ============================================================
   FORGOT PASSWORD FLOW
   ============================================================ */
function openForgotModal() {
  dom.forgotModal.classList.add("show");
  dom.forgotModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(function () { dom.resetEmail.focus(); }, 50);
}

function closeForgotModal() {
  dom.forgotModal.classList.remove("show");
  dom.forgotModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  dom.resetEmail.value = "";
  setFieldError(dom.resetEmail, dom.resetEmailError, null);
}

async function handleForgotSubmit(e) {
  e.preventDefault();

  const email = dom.resetEmail.value.trim();

  if (!email || !isValidEmail(email)) {
    setFieldError(dom.resetEmail, dom.resetEmailError, "Please enter a valid email address.");
    dom.resetEmail.focus();
    return;
  }
  setFieldError(dom.resetEmail, dom.resetEmailError, null);

  setLoading(dom.resetBtn, true, "Sending");

  try {
    // The server always returns a generic response, regardless of
    // whether the email exists, to prevent account enumeration.
    await fetch(CONFIG.FORGOT_API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email: email })
    });

    closeForgotModal();
    showMessage(
      "success",
      "If that email matches a DameCooper account, a password reset link is on its way. Check your inbox and spam folder."
    );

  } catch (err) {
    closeForgotModal();
    showMessage(
      "error",
      "We couldn't reach the server. Please try again shortly."
    );
  } finally {
    setLoading(dom.resetBtn, false);
  }
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
function bindEvents() {
  dom.form.addEventListener("submit", handleSignin);

  dom.togglePassword.addEventListener("click", function () {
    const isPassword = dom.password.type === "password";
    dom.password.type = isPassword ? "text" : "password";
    this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    this.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    dom.password.focus();
  });

  dom.loginId.addEventListener("input", function () {
    if (this.classList.contains("invalid")) {
      setFieldError(dom.loginId, dom.loginIdError, null);
    }
  });
  dom.password.addEventListener("input", function () {
    if (this.classList.contains("invalid")) {
      setFieldError(dom.password, dom.passwordError, null);
    }
  });

  dom.forgotLink.addEventListener("click", function (e) {
    e.preventDefault();
    openForgotModal();
  });
  dom.forgotClose.addEventListener("click", closeForgotModal);
  dom.forgotModal.addEventListener("click", function (e) {
    if (e.target === dom.forgotModal) closeForgotModal();
  });
  dom.forgotForm.addEventListener("submit", handleForgotSubmit);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dom.forgotModal.classList.contains("show")) {
      closeForgotModal();
    }
  });

  dom.forgotModal.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !dom.forgotModal.classList.contains("show")) return;
    const focusables = dom.forgotModal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  if (window.innerWidth > 640) {
    setTimeout(function () { dom.loginId.focus(); }, 200);
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  dom.year.textContent = new Date().getFullYear();

  // If a session already exists, skip straight to the correct portal.
  try {
    const existing =
      localStorage.getItem(CONFIG.SESSION_STORAGE_KEY) ||
      sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
    const role = sessionStorage.getItem(CONFIG.ROLE_STORAGE_KEY);

    if (existing && role && ROLE_ROUTES[role]) {
      showMessage("info", "You're already signed in. Redirecting…");
      setTimeout(function () {
        window.location.href = ROLE_ROUTES[role];
      }, 800);
      return;
    }
  } catch (_) { /* ignore */ }

  bindEvents();
});