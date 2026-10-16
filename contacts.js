   // ============================================
      // AOS
      // ============================================
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        AOS.init({
          duration: 700,
          easing: "ease-out-cubic",
          once: true,
          offset: 80,
        });
      }

      // ============================================
      // MOBILE NAVIGATION
      // ============================================
      (function () {
        const menuToggle = document.getElementById("menuToggle");
        const menuClose = document.getElementById("menuClose");
        const mobileNav = document.getElementById("mobileNav");
        const navOverlay = document.getElementById("navOverlay");
        const mobileLinks = mobileNav.querySelectorAll("a");
        const body = document.body;

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

      // ============================================
      // HEADER SCROLL
      // ============================================
      (function () {
        const header = document.getElementById("siteHeader");
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

      // ============================================
      // BACK TO TOP
      // ============================================
      (function () {
        const backToTop = document.getElementById("backToTop");
        let ticking = false;
        function onScroll() {
          if (window.scrollY > 400) {
            backToTop.classList.add("visible");
          } else {
            backToTop.classList.remove("visible");
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
        backToTop.addEventListener("click", function () {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      })();

      // ============================================
      // SMOOTH SCROLL FOR IN-PAGE ANCHORS
      // ============================================
      (function () {
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
            const headerOffset = 80;
            const targetPos =
              target.getBoundingClientRect().top +
              window.scrollY -
              headerOffset;
            window.scrollTo({
              top: targetPos,
              behavior: prefersReduced ? "auto" : "smooth",
            });
            if (history.pushState) {
              history.pushState(null, "", href);
            }
          });
        });
      })();

      // ============================================
      // CONTACT FORM
      // ============================================
      // ============================================
// CONTACT FORM — FormSubmit AJAX
// ============================================
(function () {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.style.borderColor = "";
    });

    // Validate
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

    // Email format
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

    // Disable button + show sending state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
      submitBtn.innerHTML =
        'Sending… <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>';
    }

    // Submit via FormSubmit AJAX
    const data = new FormData(form);

    fetch("https://formsubmit.co/ajax/info@damecooperinstitute.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Submission failed");
        return res.json();
      })
      .then(function () {
        form.style.display = "none";
        if (success) {
          success.classList.add("show");
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "";
          submitBtn.innerHTML = originalBtnHTML;
        }
        alert(
          "Sorry — we couldn't send your message. Please try again, or email info@damecooperinstitute.com directly."
        );
      });
  });

  // Clear error state on input
  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("input", function () {
      this.style.borderColor = "";
    });
    field.addEventListener("change", function () {
      this.style.borderColor = "";
    });
  });
})();
      // ============================================
      // CURRENT YEAR
      // ============================================
      (function () {
        const yearEl = document.getElementById("currentYear");
        if (yearEl) {
          yearEl.textContent = new Date().getFullYear();
        }
      })();