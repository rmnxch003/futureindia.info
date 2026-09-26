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

  /* Requirement type — pick-and-tag multi-select.
     Picking an option in the lower dropdown adds a removable chip to the
     box above, and takes that option out of the dropdown so it can't be
     picked twice. Removing a chip puts its option back. */
  (function () {
    var picker = document.querySelector("#requirement-picker");
    var selectedBox = document.querySelector("#requirement-selected");
    if (!picker || !selectedBox) return;

    var form = picker.closest("form");
    var placeholder = selectedBox.querySelector(".req-placeholder");
    var originalOptionsHTML = picker.innerHTML;

    function updatePlaceholder() {
      var hasChips = !!selectedBox.querySelector(".req-chip");
      if (placeholder) placeholder.classList.toggle("is-hidden", hasChips);
    }

    function addRequirement(value) {
      if (!value) return;

      var chip = document.createElement("span");
      chip.className = "req-chip";
      chip.dataset.value = value;
      chip.innerHTML =
        "<span>" + value + "</span>" +
        '<button type="button" class="req-chip-remove" aria-label="Remove ' + value + '">&times;</button>' +
        '<input type="hidden" name="requirement" value="' + value + '">';

      selectedBox.appendChild(chip);

      Array.prototype.forEach.call(picker.querySelectorAll("option"), function (opt) {
        if (opt.value === value) opt.remove();
      });

      picker.value = "";
      updatePlaceholder();
    }

    function rebuildAvailableOptions() {
      var selectedValues = Array.prototype.map.call(
        selectedBox.querySelectorAll(".req-chip"),
        function (chip) { return chip.dataset.value; }
      );
      picker.innerHTML = originalOptionsHTML;
      Array.prototype.forEach.call(picker.querySelectorAll("option"), function (opt) {
        if (selectedValues.indexOf(opt.value) !== -1) opt.remove();
      });
      picker.value = "";
    }

    picker.addEventListener("change", function () {
      addRequirement(picker.value);
    });

    selectedBox.addEventListener("click", function (e) {
      var btn = e.target.closest(".req-chip-remove");
      if (!btn) return;
      btn.closest(".req-chip").remove();
      updatePlaceholder();
      rebuildAvailableOptions();
    });

    if (form) {
      form.addEventListener("reset", function () {
        Array.prototype.slice.call(selectedBox.querySelectorAll(".req-chip")).forEach(function (chip) {
          chip.remove();
        });
        picker.innerHTML = originalOptionsHTML;
        picker.value = "";
        updatePlaceholder();
      });
    }

    updatePlaceholder();
  })();

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
                "Sorry, something went wrong sending your requirement. Please call +91 80599 45551 or email marketing@futureindia.info directly.";
              status.classList.remove("is-success");
              status.classList.add("is-visible", "is-error");
            }
          }
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Sorry, we couldn't send your requirement right now. Please call +91 80599 45551 or email marketing@futureindia.info directly.";
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
