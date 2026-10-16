/* ============================================================
   DAMECOOPER INSTITUTE — ACCEPT INVITATION
   ------------------------------------------------------------
   Public page. No authentication required. The visitor arrives
   via a link in an invitation email that contains a one-time
   token in the query string. This script:
     1. Reads the token from the URL.
     2. Verifies it against the backend.
     3. Shows the password creation form.
     4. Submits the password to activate the account.
   ============================================================ */

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  API_BASE_URL: "https://damecooperinstitute.onrender.com/api",
  REDIRECT_DELAY_MS: 2500,
  MIN_PASSWORD_LENGTH: 8
};

/* ============================================================
   STATE
   ============================================================ */
const state = {
  token: null,
  invite: null,        // { firstName, lastName, loginId, email, role }
  submitting: false
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const dom = {
  lede:                document.getElementById("inviteLede"),
  msg:                 document.getElementById("msg"),
  msgIcon:             document.getElementById("msgIcon"),
  msgText:             document.getElementById("msgText"),
  summary:             document.getElementById("accountSummary"),
  summaryName:         document.getElementById("summaryName"),
  summaryLoginId:      document.getElementById("summaryLoginId"),
  form:                document.getElementById("passwordForm"),
  newPassword:         document.getElementById("newPassword"),
  confirmPassword:     document.getElementById("confirmPassword"),
  toggleNew:           document.getElementById("toggleNew"),
  toggleConfirm:       document.getElementById("toggleConfirm"),
  pwStrength:          document.getElementById("pwStrength"),
  pwStrengthLabel:     document.getElementById("pwStrengthLabel"),
  pwRequirements:      document.getElementById("pwRequirements"),
  newPasswordError:    document.getElementById("newPasswordError"),
  confirmPasswordError: document.getElementById("confirmPasswordError"),
  submitBtn:           document.getElementById("submitBtn"),
  successState:        document.getElementById("successState"),
  successText:         document.getElementById("successText"),
  cardFoot:            document.getElementById("cardFoot")
};

/* ============================================================
   UI HELPERS
   ============================================================ */
function showMessage(kind, text) {
  dom.msg.className = "msg show " + kind;
  dom.msgText.textContent = text;
  dom.msgIcon.className = "fas " + (
    kind === "error"   ? "fa-circle-exclamation" :
    kind === "success" ? "fa-circle-check" :
    "fa-circle-info"
  );
}

function clearMessage() {
  dom.msg.className = "msg";
  dom.msgText.textContent = "";
}

function setFieldError(field, errorEl, message) {
  if (message) {
    field.classList.add("invalid");
    field.setAttribute("aria-invalid", "true");
    errorEl.querySelector("span").textContent = message;
    errorEl.classList.add("show");
  } else {
    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
    errorEl.classList.remove("show");
  }
}

function setLoading(button, isLoading, label) {
  if (!button) return;
  if (button.dataset.originalHtml === undefined) {
    button.dataset.originalHtml = button.innerHTML;
  }
  if (isLoading) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML =
      (label || "Please wait") +
      ' <i class="fas fa-circle-notch" aria-hidden="true"></i>';
  } else {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = button.dataset.originalHtml;
  }
}

function getTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

/* ============================================================
   PASSWORD STRENGTH + REQUIREMENTS
   ============================================================ */
function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

function evaluateRequirements(pw) {
  return {
    length: pw.length >= CONFIG.MIN_PASSWORD_LENGTH,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw)
  };
}

function renderStrength(pw) {
  const bars = dom.pwStrength.querySelectorAll(".pw-strength-bar");
  const score = scorePassword(pw);

  bars.forEach(function (b) {
    b.classList.remove("active", "weak", "good", "strong");
  });

  const label = ["Use at least 8 characters.", "Weak", "Fair", "Good", "Strong"][score];
  const cls   = ["", "weak", "good", "good", "strong"][score];

  for (let i = 0; i < score; i++) {
    bars[i].classList.add("active");
    if (cls) bars[i].classList.add(cls);
  }
  dom.pwStrengthLabel.textContent = pw ? label : "Use at least 8 characters.";
}

function renderRequirements(pw) {
  const results = evaluateRequirements(pw);
  dom.pwRequirements.querySelectorAll(".pw-req").forEach(function (node) {
    const key = node.dataset.req;
    if (results[key]) {
      node.classList.add("met");
    } else {
      node.classList.remove("met");
    }
  });
}

/* ============================================================
   VERIFY TOKEN
   ------------------------------------------------------------
   Called once on page load. If the token is valid, shows the
   form. Otherwise displays the error and hides everything else.
   ============================================================ */
async function verifyToken() {
  state.token = getTokenFromQuery();

  if (!state.token) {
    showMessage(
      "error",
      "This invitation link is missing its secure token. Please use the original link from your email, or contact the IT Service Desk."
    );
    dom.lede.textContent = "We can't verify this invitation.";
    dom.cardFoot.style.display = "none";
    return;
  }

  try {
    const res = await fetch(CONFIG.API_BASE_URL + "/invitations/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ token: state.token })
    });

    let data = null;
    try { data = await res.json(); } catch (_) { /* empty */ }

    if (!res.ok) {
      showMessage(
        "error",
        (data && data.message) ||
          "This invitation link is invalid or has expired. Please contact the IT Service Desk for a new one."
      );
      dom.lede.textContent = "We can't verify this invitation.";
      dom.cardFoot.style.display = "none";
      return;
    }

    state.invite = data.invite;
    showInviteReady();
  } catch (err) {
    showMessage(
      "error",
      "We couldn't reach the server. Please check your connection and try again."
    );
    dom.lede.textContent = "Something went wrong.";
    dom.cardFoot.style.display = "none";
  }
}

function showInviteReady() {
  clearMessage();
  dom.lede.textContent =
    "Welcome, " + state.invite.firstName +
    ". Choose a password to activate your account.";
  dom.summaryName.textContent =
    state.invite.firstName + " " + state.invite.lastName;
  dom.summaryLoginId.textContent =
    "DameCooper ID: " + state.invite.loginId;
  dom.summary.style.display = "";
  dom.form.style.display = "";
  setTimeout(function () { dom.newPassword.focus(); }, 100);
}

/* ============================================================
   SUBMIT — activate the account
   ============================================================ */
async function handleSubmit(e) {
  e.preventDefault();
  if (state.submitting) return;
  clearMessage();

  const pw = dom.newPassword.value;
  const confirm = dom.confirmPassword.value;

  let valid = true;

  if (!pw || pw.length < CONFIG.MIN_PASSWORD_LENGTH) {
    setFieldError(
      dom.newPassword,
      dom.newPasswordError,
      "Password must be at least " + CONFIG.MIN_PASSWORD_LENGTH + " characters."
    );
    valid = false;
  } else {
    setFieldError(dom.newPassword, dom.newPasswordError, null);
  }

  if (pw !== confirm) {
    setFieldError(
      dom.confirmPassword,
      dom.confirmPasswordError,
      "Passwords do not match."
    );
    valid = false;
  } else {
    setFieldError(dom.confirmPassword, dom.confirmPasswordError, null);
  }

  if (!valid) {
    const firstInvalid = dom.newPassword.classList.contains("invalid")
      ? dom.newPassword
      : dom.confirmPassword;
    firstInvalid.focus();
    return;
  }

  state.submitting = true;
  setLoading(dom.submitBtn, true, "Activating account");

  try {
    const res = await fetch(CONFIG.API_BASE_URL + "/invitations/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ token: state.token, password: pw })
    });

    let data = null;
    try { data = await res.json(); } catch (_) { /* empty */ }

    if (!res.ok) {
      showMessage(
        "error",
        (data && data.message) ||
          "We couldn't activate your account. The invitation may have expired — please contact the IT Service Desk."
      );
      setLoading(dom.submitBtn, false);
      state.submitting = false;
      return;
    }

    showSuccess("Your account is ready. Redirecting to sign-in…");
  } catch (err) {
    showMessage("error", "We couldn't reach the server. Please try again.");
    setLoading(dom.submitBtn, false);
    state.submitting = false;
  }
}

function showSuccess(message) {
  dom.form.style.display = "none";
  dom.summary.style.display = "none";
  dom.msg.className = "msg";
  dom.msgText.textContent = "";
  dom.cardFoot.style.display = "none";

  dom.successText.textContent = message;
  dom.successState.classList.add("show");
  dom.lede.textContent = "Account activated";

  setTimeout(function () {
    window.location.href = "signin.html?activated=1";
  }, CONFIG.REDIRECT_DELAY_MS);
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
function bindEvents() {
  dom.toggleNew.addEventListener("click", function () {
    const isPassword = dom.newPassword.type === "password";
    dom.newPassword.type = isPassword ? "text" : "password";
    this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    this.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    dom.newPassword.focus();
  });

  dom.toggleConfirm.addEventListener("click", function () {
    const isPassword = dom.confirmPassword.type === "password";
    dom.confirmPassword.type = isPassword ? "text" : "password";
    this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    this.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    dom.confirmPassword.focus();
  });

  dom.newPassword.addEventListener("input", function () {
    const value = this.value;
    renderStrength(value);
    renderRequirements(value);

    if (this.classList.contains("invalid")) {
      setFieldError(dom.newPassword, dom.newPasswordError, null);
    }
    if (
      dom.confirmPassword.classList.contains("invalid") &&
      dom.confirmPassword.value === value
    ) {
      setFieldError(dom.confirmPassword, dom.confirmPasswordError, null);
    }
  });

  dom.confirmPassword.addEventListener("input", function () {
    if (this.classList.contains("invalid")) {
      setFieldError(dom.confirmPassword, dom.confirmPasswordError, null);
    }
  });

  dom.form.addEventListener("submit", handleSubmit);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  bindEvents();
  verifyToken();
});