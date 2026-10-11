(function () {
  "use strict";
  const form = document.getElementById("demoRequestForm");
  if (!form) return;
  const status = document.getElementById("demoStatus");
  const button = document.getElementById("demoSubmit");
  const recipient = "bi95ny@student.sunderland.ac.uk";
  const endpoint = "https://formsubmit.co/ajax/" + recipient;

  function showStatus(message, isError) {
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle("error", Boolean(isError));
    status.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }
  function validateForm() {
    if (!form.checkValidity()) {
      form.reportValidity();
      showStatus("Please complete the required fields and check the email address before sending your request.", true);
      return false;
    }
    const requirements = document.getElementById("requirements");
    if (requirements && requirements.value.trim().length < 10) {
      requirements.focus();
      showStatus("Please describe what you want to improve in at least 10 characters.", true);
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
      try { result = raw ? JSON.parse(raw) : {}; } catch (_) { result = { message: raw }; }
      const accepted = result.success === true || result.success === "true";
      if (!response.ok || !accepted) {
        const message = typeof result.message === "string" && result.message.trim() ? result.message : "The email service did not accept the request.";
        throw new Error(message);
      }
      form.reset();
      showStatus("Your request was accepted by the email service and routed to " + recipient + ". First-time use may require the recipient to confirm FormSubmit's activation email. For urgent enquiries, contact the team directly at " + recipient + ".", false);
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
