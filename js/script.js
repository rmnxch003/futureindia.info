/* Future India Technologies — site behavior */
(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Header shadow once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Contact / quote form — submits to Web3Forms, which forwards the
     requirement straight to marketing@futureindia.info. */
  var form = document.querySelector("#quote-request-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var name = data.get("name") || "there";

      if (submitBtn) submitBtn.disabled = true;
      if (status) {
        status.textContent = "Sending your requirement…";
        status.classList.remove("is-success", "is-error");
        status.classList.add("is-visible");
      }

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (result) {
          if (result.success) {
            if (status) {
              status.textContent =
                "Thanks, " + name + " — your requirement has been sent. Our team will contact you shortly at the details you provided.";
              status.classList.remove("is-error");
              status.classList.add("is-visible", "is-success");
            }
            form.reset();
          } else {
            if (status) {
              status.textContent =
                "Sorry, something went wrong sending your requirement. Please call +91 80599 45551 or email seith@futureindia.info directly.";
              status.classList.remove("is-success");
              status.classList.add("is-visible", "is-error");
            }
          }
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Sorry, we couldn't send your requirement right now. Please call +91 80599 45551 or email seith@futureindia.info directly.";
            status.classList.remove("is-success");
            status.classList.add("is-visible", "is-error");
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* Footer year */
  var yearEl = document.querySelector("#current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
