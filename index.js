 // ============================================
      // AOS — init only if reduced motion not preferred
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
          // Focus the close button for accessibility
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

        // Close on link click
        mobileLinks.forEach(function (link) {
          link.addEventListener("click", closeMenu);
        });

        // Close on Escape
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && mobileNav.classList.contains("open")) {
            closeMenu();
          }
        });

        // Focus trap inside mobile nav
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
      // HEADER SCROLL STATE
      // ============================================
      (function () {
        const header = document.getElementById("siteHeader");
        let lastY = 0;
        let ticking = false;

        function onScroll() {
          const y = window.scrollY;
          if (y > 20) {
            header.classList.add("scrolled");
          } else {
            header.classList.remove("scrolled");
          }
          lastY = y;
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
      // SMOOTH SCROLL FOR ANCHOR LINKS
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

            // Update URL hash without jumping
            if (history.pushState) {
              history.pushState(null, "", href);
            }
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