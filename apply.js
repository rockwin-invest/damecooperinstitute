/* ============================================================
   DAMECOOPER INSTITUTE — APPLY PAGE
   ------------------------------------------------------------
   Handles:
     • AOS scroll animations
     • Query-string pre-fill (?programme=… from programmes page)
     • Mobile navigation drawer
     • Header scroll state
     • Back-to-top button
     • Smooth scrolling for in-page anchors
     • Application form submission via FormSubmit AJAX
     • Current-year copyright stamp
   ============================================================ */

/* ============================================================
   1. AOS — scroll animations
   ============================================================ */
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  AOS.init({
    duration: 700,
    easing: "ease-out-cubic",
    once: true,
    offset: 80
  });
}

/* ============================================================
   2. PRE-SELECT PROGRAMME FROM PROGRAMMES PAGE
   ------------------------------------------------------------
   If the user arrived here via ?programme=… from programmes.html,
   pre-fill the relevant fields, show a confirmation banner, and
   add hidden fields so the email names exactly what was chosen.

   Uses dynamic "does this option exist?" checks rather than
   hardcoded maps, so adding new schools / levels / modes to the
   dropdowns automatically makes pre-selection work for them.
   ============================================================ */
(function preSelectProgramme() {
  const params = new URLSearchParams(window.location.search);
  const programme = params.get("programme");
  const title     = params.get("title");
  const school    = params.get("school");
  const level     = params.get("level");
  const mode      = params.get("mode");
  const pathway   = params.get("pathway");

  if (!programme && !title) return;

  // ---- Confirmation banner
  const formWrap = document.querySelector(".application-form-wrap");
  if (formWrap) {
    const banner = document.createElement("div");
    banner.style.cssText =
      "background:rgba(182,154,89,0.1);" +
      "border-left:3px solid #b69a59;" +
      "padding:14px 16px;" +
      "border-radius:2px;" +
      "margin-bottom:24px;" +
      "font-size:0.875rem;" +
      "line-height:1.6;";
    banner.innerHTML =
      '<strong style="color:#10243a;display:block;margin-bottom:4px;">' +
        "You're applying for:" +
      '</strong>' +
      '<span style="color:#66717d;">' +
        (title ? title : programme) +
        (programme
          ? ' <span style="font-family:monospace;font-size:0.75rem;color:#987b40;">(' + programme + ')</span>'
          : "") +
      '</span>' +
      '<br><a href="programmes.html" style="color:#987b40;font-weight:600;font-size:0.8125rem;display:inline-block;margin-top:6px;">' +
        '← Change programme' +
      '</a>';
    formWrap.insertBefore(banner, formWrap.firstChild);
  }

  // ---- Helper: set a <select>'s value only if that option exists
  function selectIfOptionExists(selectEl, value) {
    if (!selectEl || !value) return;
    const exists = Array.from(selectEl.options).some(function (opt) {
      return opt.value === value;
    });
    if (exists) selectEl.value = value;
  }

  // ---- Pre-select school / level / mode
  selectIfOptionExists(document.getElementById("school"), school);
  selectIfOptionExists(document.getElementById("level"), level);
  selectIfOptionExists(document.getElementById("mode"), mode);

  // ---- Add hidden fields so the submitted email names the choice
  const form = document.getElementById("applicationForm");
  if (form) {
    function addHidden(name, value) {
      if (!value) return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    addHidden("Selected programme code", programme);
    addHidden("Selected programme title", title);
    addHidden("Selected pathway", pathway);
  }
})();

/* ============================================================
   3. MOBILE NAVIGATION
   ============================================================ */
(function mobileNav() {
  const menuToggle = document.getElementById("menuToggle");
  const menuClose  = document.getElementById("menuClose");
  const mobileNav  = document.getElementById("mobileNav");
  const navOverlay = document.getElementById("navOverlay");
  const body = document.body;

  if (!menuToggle || !menuClose || !mobileNav || !navOverlay) return;

  const mobileLinks = mobileNav.querySelectorAll("a");

  function openMenu() {
    mobileNav.classList.add("open");
    navOverlay.classList.add("active");
    mobileNav.setAttribute("aria-hidden", "false");
    navOverlay.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden";
    menuClose.focus();
  }

  function closeMenu() {
    mobileNav.classList.remove("open");
    navOverlay.classList.remove("active");
    mobileNav.setAttribute("aria-hidden", "true");
    navOverlay.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    body.style.overflow = "";
    menuToggle.focus();
  }

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  navOverlay.addEventListener("click", closeMenu);

  mobileLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileNav.classList.contains("open")) {
      closeMenu();
    }
  });

  // Focus trap inside the drawer
  mobileNav.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !mobileNav.classList.contains("open")) return;
    const focusables = mobileNav.querySelectorAll(
      'a[href], button:not([disabled])'
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
})();

/* ============================================================
   4. HEADER SCROLL STATE
   ============================================================ */
(function headerScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
})();

/* ============================================================
   5. BACK TO TOP
   ============================================================ */
(function backToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  let ticking = false;

  function onScroll() {
    if (window.scrollY > 400) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* ============================================================
   6. SMOOTH SCROLL FOR IN-PAGE ANCHORS
   ============================================================ */
(function smoothScroll() {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerOffset = 90;
      const targetPos =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: targetPos,
        behavior: prefersReduced ? "auto" : "smooth"
      });
      if (history.pushState) {
        history.pushState(null, "", href);
      }
    });
  });
})();

/* ============================================================
   7. APPLICATION FORM — FormSubmit AJAX
   ============================================================ */
(function applicationForm() {
  const form = document.getElementById("applicationForm");
  const success = document.getElementById("applicationSuccess");
  if (!form || !success) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.style.borderColor = "";
    });

    // Validate required fields
    let valid = true;
    const required = form.querySelectorAll("[required]");

    required.forEach(function (field) {
      if (
        (field.type === "checkbox" && !field.checked) ||
        (field.type !== "checkbox" && !field.value.trim())
      ) {
        valid = false;
        field.style.borderColor = "#c0392b";
      }
    });

    // Email format check
    const email = form.querySelector("#email");
    if (email && email.value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email.value)) {
        valid = false;
        email.style.borderColor = "#c0392b";
      }
    }

    if (!valid) {
      const firstInvalid = form.querySelector(
        '[style*="border-color: rgb(192, 57, 43)"]'
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid.focus({ preventScroll: true });
      }
      return;
    }

    // Show sending state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
      submitBtn.innerHTML =
        'Submitting… <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>';
    }

    // Post to FormSubmit
    const data = new FormData(form);

    fetch("https://formsubmit.co/ajax/damecoopertraining@gmail.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Submission failed");
        return res.json();
      })
      .then(function () {
        form.style.display = "none";
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "";
          submitBtn.innerHTML = originalBtnHTML;
        }
        alert(
          "Sorry — we couldn't submit your application. Please try again, or email info@damecooperinstitute.com directly."
        );
      });
  });

  // Clear error state as the user corrects the field
  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("input", function () {
      this.style.borderColor = "";
    });
    field.addEventListener("change", function () {
      this.style.borderColor = "";
    });
  });

  // Reset handler — clear any residual error styling
  form.addEventListener("reset", function () {
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.style.borderColor = "";
    });
  });
})();

/* ============================================================
   8. CURRENT YEAR
   ============================================================ */
(function currentYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();