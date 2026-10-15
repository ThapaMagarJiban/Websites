(function () {
  "use strict";

  const form = document.getElementById("demoRequestForm");
  if (!form) return;

  const status = document.getElementById("demoStatus");
  const button = document.getElementById("demoSubmit");

  const companyInput = document.getElementById("company");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const preferredTimeInput = document.getElementById("preferredTime");

  const recipient = "bi95ny@student.sunderland.ac.uk" + "pkit25b.bpn@ismt.edu.np" + "pkit24a.jbn@ismt.edu.np";
  const endpoint = "https://formsubmit.co/ajax/" + recipient;

  // Company name: letters and spaces only.
  if (companyInput) {
    companyInput.addEventListener("input", function () {
      companyInput.value = companyInput.value
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "")
        .replace(/\s+/g, " ")
        .replace(/^ /, "");
    });
  }

  // Contact name: letters, spaces, hyphens and apostrophes only.
  if (nameInput) {
    nameInput.addEventListener("input", function () {
      nameInput.value = nameInput.value.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g,
        ""
      );
    });
  }

  // Email: lowercase letters and numbers, with @ and dots only.
  // Uppercase input becomes lowercase; other symbols are removed.
  if (emailInput) {
    emailInput.addEventListener("input", function () {
      emailInput.value = emailInput.value
        .toLowerCase()
        .replace(/[^a-z0-9.@]/g, "");
    });
  }

  // Phone: digits only; preserve leading zeroes.
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      phoneInput.value = phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 15);
    });
  }

  // Get current date and time in Nepal Time (NPT).
  function getNepalDateTimeLocal(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);

    const values = {};

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }

    return (
      values.year + "-" +
      values.month + "-" +
      values.day + "T" +
      values.hour + ":" +
      values.minute
    );
  }

  // Stop visitors from choosing past demo dates or times.
  function updatePreferredTimeMinimum() {
    if (!preferredTimeInput) return;

    const minimum = getNepalDateTimeLocal();
    preferredTimeInput.min = minimum;

    if (
      preferredTimeInput.value &&
      preferredTimeInput.value < minimum
    ) {
      preferredTimeInput.setCustomValidity(
        "Please choose a current or future date and time in Nepal Time (NPT)."
      );
    } else {
      preferredTimeInput.setCustomValidity("");
    }
  }

  if (preferredTimeInput) {
    updatePreferredTimeMinimum();

    preferredTimeInput.addEventListener(
      "input",
      updatePreferredTimeMinimum
    );

    preferredTimeInput.addEventListener(
      "change",
      updatePreferredTimeMinimum
    );
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle("error", Boolean(isError));

    status.scrollIntoView({
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches ? "auto" : "smooth",
      block: "nearest"
    });
  }

  function validateForm() {
    updatePreferredTimeMinimum();

    if (!form.checkValidity()) {
      form.reportValidity();

      showStatus(
        "Please complete the required fields and check the email address before sending your request.",
        true
      );

      return false;
    }

    const requirements =
      document.getElementById("requirements");

    if (
      requirements &&
      requirements.value.trim().length < 1
    ) {
      requirements.focus();

      showStatus(
        "Please describe what you want to improve.",
        true
      );

      return false;
    }

    return true;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    status.hidden = true;
    status.textContent = "";
    status.classList.remove("error");

    if (!validateForm()) return;

    const original = button.textContent;

    button.disabled = true;
    button.textContent = "Sending request…";

    const fields = new FormData(form);
    const payload = {};

    for (const [key, value] of fields.entries()) {
      payload[key] = String(value).trim();
    }

    payload._subject =
      "Tech-Yeti demo request — " +
      (payload.requestedDemo || "New enquiry");

    payload._template = "table";
    payload._replyto = payload.email || "";
    payload._url = window.location.href;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let result = {};

      try {
        result = raw ? JSON.parse(raw) : {};
      } catch (_) {
        result = { message: raw };
      }

      const accepted =
        result.success === true ||
        result.success === "true";

      if (!response.ok || !accepted) {
        const message =
          typeof result.message === "string" &&
          result.message.trim()
            ? result.message
            : "The email service did not accept the request.";

        throw new Error(message);
      }

      form.reset();
      updatePreferredTimeMinimum();

      showStatus(
        "Your request has been sent successfully!",
        false
      );

    } catch (error) {
      console.error(
        "Tech-Yeti form submission error:",
        error
      );

      const network = error instanceof TypeError;

      const message = network
        ? "The email service could not be reached. Check your internet connection and make sure you are viewing the deployed HTTPS website, then try again."
        : (
            error && error.message
              ? error.message
              : "The request could not be confirmed by the email service."
          );

      showStatus(
        "Your request was not confirmed as sent. " +
        message +
        " You can email Tech-Yeti directly at " +
        recipient +
        ".",
        true
      );

    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });
})();
