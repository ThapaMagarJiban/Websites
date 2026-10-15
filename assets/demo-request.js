(function () {
  "use strict";

  const form = document.getElementById("demoRequestForm");
  if (!form) return;

  const status = document.getElementById("demoStatus");
  const button = document.getElementById("demoSubmit");
  const recipient = "bi95ny@student.sunderland.ac.uk";
  const endpoint = "https://formsubmit.co/ajax/" + recipient;

  const companyInput = document.getElementById("company");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const requirementsInput = document.getElementById("requirements");
  const preferredTimeInput = document.getElementById("preferredTime");
  const notesInput = document.getElementById("notes");

  // Contact names: Unicode letters only, with spaces, hyphens and apostrophes allowed.
  if (nameInput) {
    nameInput.addEventListener("input", function () {
      const before = this.value;
      const start = this.selectionStart;
      this.value = this.value
        .replace(/[^\p{L}\p{M}\s'-]/gu, "")
        .replace(/\s{2,}/g, " ");
      this.setCustomValidity("");
      if (this.value !== before && typeof start === "number") {
        const position = Math.min(start, this.value.length);
        this.setSelectionRange(position, position);
      }
    });
  }

  // Clear custom errors as users correct a previously invalid field.
  [companyInput, emailInput, requirementsInput].filter(Boolean).forEach(function (input) {
    input.addEventListener("input", function () {
      this.setCustomValidity("");
    });
  });

  // Phone is treated as text so leading zeroes are preserved. Only digits are retained.
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 15);
      this.setCustomValidity("");
    });
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle("error", Boolean(isError));
    status.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest"
    });
  }

  function trimOptionalAndTextFields() {
    [companyInput, nameInput, emailInput, requirementsInput, preferredTimeInput, notesInput]
      .filter(Boolean)
      .forEach(function (input) {
        input.value = input.value.trim();
      });
  }

  function validateForm() {
    // Trimming first prevents spaces-only input from satisfying required fields.
    trimOptionalAndTextFields();

    if (companyInput) {
      companyInput.setCustomValidity(
        companyInput.value.length < 2
          ? "Enter a company or organisation name (at least 2 characters)."
          : ""
      );
    }

    if (emailInput) {
      // HTML type=email validation is also used; this additionally asks for a dotted domain.
      const email = emailInput.value;
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      emailInput.setCustomValidity(
        email && !validEmail
          ? "Enter a valid email address, such as name@company.com."
          : ""
      );
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      showStatus("Please check the required fields, email address and consent before sending your request.", true);
      return false;
    }

    const name = nameInput ? nameInput.value : "";
    if (nameInput && !/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(name)) {
      nameInput.setCustomValidity("Enter a name using letters only. Spaces, hyphens and apostrophes are allowed; numbers are not.");
      nameInput.reportValidity();
      nameInput.focus();
      showStatus("Please enter a valid contact name using letters only.", true);
      return false;
    }
    if (nameInput) nameInput.setCustomValidity("");

    if (phoneInput && phoneInput.value && !/^[0-9]{7,15}$/.test(phoneInput.value)) {
      phoneInput.setCustomValidity("Enter 7 to 15 digits only. Do not use +, spaces, letters or decimal points.");
      phoneInput.reportValidity();
      phoneInput.focus();
      showStatus("Please enter a valid phone number using 7 to 15 digits only.", true);
      return false;
    }
    if (phoneInput) phoneInput.setCustomValidity("");

    if (requirementsInput && requirementsInput.value.length === 0) {
      requirementsInput.setCustomValidity("Please describe what you would like to improve; this field cannot be blank.");
      requirementsInput.reportValidity();
      requirementsInput.focus();
      showStatus("Please describe what you would like to improve.", true);
      return false;
    }
    if (requirementsInput) requirementsInput.setCustomValidity("");

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
    for (const [key, value] of fields.entries()) payload[key] = String(value).trim();
    payload._subject = "Tech-Yeti demo request — " + (payload.requestedDemo || "New enquiry");
    payload._template = "table";
    payload._replyto = payload.email || "";
    payload._url = window.location.href;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; }
      catch (_) { result = { message: raw }; }

      const accepted = result.success === true || result.success === "true";
      if (!response.ok || !accepted) {
        const message = typeof result.message === "string" && result.message.trim()
          ? result.message
          : "The email service did not accept the request.";
        throw new Error(message);
      }

      form.reset();
      showStatus("Your request has been sent successfully!", false);
    } catch (error) {
      console.error("Tech-Yeti form submission error:", error);
      const network = error instanceof TypeError;
      const message = network
        ? "The email service could not be reached. Check your internet connection and make sure you are viewing the deployed HTTPS website, then try again."
        : (error && error.message ? error.message : "The request could not be confirmed by the email service.");
      showStatus("Your request was not confirmed as sent. " + message + " You can email Tech-Yeti directly at " + recipient + ".", true);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });
})();
