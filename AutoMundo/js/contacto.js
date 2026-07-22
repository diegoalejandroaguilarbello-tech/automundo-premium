const items = document.querySelectorAll(".contact-card, .contact-form");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = 1;
      entry.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.2 });

items.forEach(el => {
  el.style.opacity = 0;
  el.style.transform = "translateY(20px)";
  el.style.transition = "0.6s ease";
  observer.observe(el);
});
const contactForm = document.querySelector("#contactForm");
const contactFormStatus = document.querySelector("#contactFormStatus");
const contactSubmitButton = document.querySelector("#contactSubmitButton");
const honeypotField = document.querySelector("#contactWebsite");
const turnstileError = document.querySelector("#turnstileError");
const API_BASE_URL =
  window.AUTOMUNDO_API_BASE_URL ||
  "http://localhost:3000/api";

const turnstileWidget =
  document.querySelector("#turnstileWidget");

let turnstileWidgetId = null;
let turnstileReady = false;
let turnstileScriptPromise;

function loadTurnstileApi() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise(
    (resolve, reject) => {
      const handleLoad = () => {
        if (window.turnstile) {
          resolve(window.turnstile);
        } else {
          reject(new Error(
            "Cloudflare Turnstile no quedó disponible."
          ));
        }
      };

      const existingScript =
        document.querySelector("#turnstileApi");

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          handleLoad,
          { once: true }
        );
        existingScript.addEventListener(
          "error",
          () => reject(new Error(
            "No se pudo cargar Cloudflare Turnstile."
          )),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.id = "turnstileApi";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad, {
        once: true,
      });
      script.addEventListener(
        "error",
        () => reject(new Error(
          "No se pudo cargar Cloudflare Turnstile."
        )),
        { once: true }
      );
      document.head.appendChild(script);
    }
  );

  return turnstileScriptPromise;
}

async function initializeTurnstile() {
  if (!turnstileWidget) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/config/public`,
      { cache: "no-store" }
    );

    const config =
      await response.json().catch(() => ({}));

    if (!response.ok || !config.turnstileSiteKey) {
      throw new Error(
        "La verificación de seguridad no está configurada."
      );
    }

    const turnstile = await loadTurnstileApi();

    turnstileWidgetId = turnstile.render(
      turnstileWidget,
      {
        sitekey: config.turnstileSiteKey,
        theme: "auto",
        size: "flexible",
        language: "es",
        callback() {
          turnstileError.textContent = "";
        },
        "error-callback"(errorCode) {
          turnstileError.textContent =
            `No se pudo completar la verificación (${errorCode}).`;
          return true;
        },
        "expired-callback"() {
          turnstileError.textContent =
            "La verificación venció. Complétala nuevamente.";
        },
        "timeout-callback"() {
          turnstileError.textContent =
            "La verificación agotó el tiempo. Intenta nuevamente.";
        },
      }
    );

    turnstileReady = true;
    turnstileWidget.setAttribute(
      "aria-busy",
      "false"
    );
  } catch (error) {
    turnstileReady = false;
    turnstileWidget.setAttribute(
      "aria-busy",
      "false"
    );
    turnstileError.textContent =
      error.message ||
      "No se pudo iniciar la verificación de seguridad.";
    console.error(error);
  }
}

initializeTurnstile();

if (contactForm) {
  contactForm.noValidate = true;

  const fields = {
    fullName: {
      input: document.querySelector("#contactName"),
      error: document.querySelector("#contactNameError"),
    },
    email: {
      input: document.querySelector("#contactEmail"),
      error: document.querySelector("#contactEmailError"),
    },
    phone: {
      input: document.querySelector("#contactPhone"),
      error: document.querySelector("#contactPhoneError"),
    },
    message: {
      input: document.querySelector("#contactMessage"),
      error: document.querySelector("#contactMessageError"),
    },
  };

  const namePattern =
    /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;

  const phonePattern =
    /^\+?[\d\s().-]+$/;

  function normalizeSpaces(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function isValidEmail(value) {
    if (!/^[^\s@]+@[^\s@]+$/.test(value)) {
      return false;
    }

    const [localPart, domain] = value.split("@");

    if (
      !localPart ||
      !domain ||
      localPart.length > 64 ||
      domain.length > 253
    ) {
      return false;
    }

    if (
      localPart.startsWith(".") ||
      localPart.endsWith(".") ||
      localPart.includes("..") ||
      domain.includes("..")
    ) {
      return false;
    }

    const labels = domain.split(".");

    if (
      labels.length < 2 ||
      labels.at(-1).length < 2
    ) {
      return false;
    }

    return labels.every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)
    );
  }

  function getValidationError(fieldName) {
    const value = fields[fieldName].input.value.trim();

    if (fieldName === "fullName") {
      const normalizedName = normalizeSpaces(value);

      const letterCount =
        (normalizedName.match(/\p{L}/gu) || []).length;

      if (!normalizedName) {
        return "Ingresa tu nombre completo.";
      }

      if (normalizedName.length < 2) {
        return "El nombre debe tener al menos 2 caracteres.";
      }

      if (normalizedName.length > 100) {
        return "El nombre no puede superar 100 caracteres.";
      }

      if (
        !namePattern.test(normalizedName) ||
        letterCount < 2
      ) {
        return "El nombre solo puede contener letras, espacios, apóstrofes y guiones.";
      }
    }

    if (fieldName === "email") {
      if (!value) {
        return "Ingresa tu correo electrónico.";
      }

      if (value.length > 180) {
        return "El correo es demasiado largo.";
      }

      if (!isValidEmail(value)) {
        return "Ingresa un correo electrónico válido.";
      }
    }

    if (fieldName === "phone" && value) {
      const digitCount =
        value.replace(/\D/g, "").length;

      if (!phonePattern.test(value)) {
        return "El teléfono contiene caracteres inválidos.";
      }

      if (digitCount < 7 || digitCount > 15) {
        return "El teléfono debe contener entre 7 y 15 números.";
      }
    }

    if (fieldName === "message") {
      const meaningfulCharacters =
        (value.match(/[\p{L}\p{N}]/gu) || []).length;

      if (!value) {
        return "Escribe el mensaje que deseas enviar.";
      }

      if (value.length < 10) {
        return "El mensaje debe tener al menos 10 caracteres.";
      }

      if (value.length > 1000) {
        return "El mensaje no puede superar 1000 caracteres.";
      }

      if (meaningfulCharacters < 5) {
        return "Escribe un mensaje con información suficiente.";
      }
    }

    return "";
  }

  function showFieldState(fieldName, errorMessage) {
    const { input, error } = fields[fieldName];
    const hasValue = input.value.trim().length > 0;

    error.textContent = errorMessage;

    input.classList.toggle(
      "is-invalid",
      Boolean(errorMessage)
    );

    input.classList.toggle(
      "is-valid",
      !errorMessage && hasValue
    );

    input.setAttribute(
      "aria-invalid",
      errorMessage ? "true" : "false"
    );
  }

  function validateField(fieldName) {
    const errorMessage =
      getValidationError(fieldName);

    showFieldState(fieldName, errorMessage);

    return !errorMessage;
  }

  function validateForm() {
    const invalidFields =
      Object.keys(fields).filter(
        (fieldName) => !validateField(fieldName)
      );

    if (invalidFields.length) {
      fields[invalidFields[0]].input.focus();
      return false;
    }

    return true;
  }

  function setFormStatus(message, type = "") {
    contactFormStatus.textContent = message;

    contactFormStatus.className =
      type ? `status-${type}` : "";
  }

  function clearFieldStates() {
    Object.values(fields).forEach(
      ({ input, error }) => {
        input.classList.remove(
          "is-invalid",
          "is-valid"
        );

        input.removeAttribute("aria-invalid");
        error.textContent = "";
      }
    );
  }

  Object.entries(fields).forEach(
    ([fieldName, { input }]) => {
      input.addEventListener("blur", () => {
        validateField(fieldName);
      });

      input.addEventListener("input", () => {
        if (
          input.classList.contains("is-invalid")
        ) {
          validateField(fieldName);
        }

        setFormStatus("");
      });
    }
  );

  contactForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      setFormStatus("");

if (!turnstileReady) {
  turnstileError.textContent =
    turnstileError.textContent ||
    "Espera a que cargue la verificación de seguridad.";
  setFormStatus(
    "La verificación de seguridad todavía no está disponible.",
    "error"
  );
  return;
}

turnstileError.textContent = "";

if (!validateForm()) {
  setFormStatus(
    "Revisa los campos marcados antes de enviar.",
    "error"
  );
  return;
}

const turnstileToken =
  contactForm.querySelector(
    '[name="cf-turnstile-response"]'
  )?.value.trim() || "";

if (!turnstileToken) {
  turnstileError.textContent =
    "Completa la verificación de seguridad.";

  setFormStatus(
    "Debes completar la verificación antes de enviar.",
    "error"
  );
  return;
}

const fullName =
        normalizeSpaces(fields.fullName.input.value);

      const [firstName, ...lastNameParts] =
        fullName.split(" ");

       const payload = {
  firstName,
  lastName: lastNameParts.join(" "),
  email:
    fields.email.input.value
      .trim()
      .toLowerCase(),
  phone:
    fields.phone.input.value.trim() ||
    null,
  message:
    fields.message.input.value.trim(),
  source: "contacto-web",
  website:
    honeypotField?.value.trim() || "",
  turnstileToken,
};

      contactSubmitButton.disabled = true;
      contactSubmitButton.textContent = "Enviando...";

      setFormStatus(
        "Enviando solicitud...",
        "loading"
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/leads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const data =
          await response.json().catch(() => ({}));

        if (!response.ok) {
          if (data.errors) {
            const fieldMap = {
              firstName: "fullName",
              lastName: "fullName",
              email: "email",
              phone: "phone",
              message: "message",
            };

            Object.entries(data.errors).forEach(
              ([serverField, message]) => {
                const localField =
                  fieldMap[serverField];

                if (localField) {
                  showFieldState(
                    localField,
                    message
                  );
                }
              }
            );
          }
         
        if (data.errors?.turnstile) {
           turnstileError.textContent =
           data.errors.turnstile;
         }

          throw new Error(
            data.message ||
            "No se pudo enviar el mensaje."
          );
        }

        contactForm.reset();
        clearFieldStates();

        setFormStatus(
          "Mensaje enviado correctamente. Te contactaremos pronto.",
          "success"
        );
      } catch (error) {
        const message =
          error instanceof TypeError
            ? "No fue posible conectar con el servidor. Intenta nuevamente."
            : error.message;

        setFormStatus(message, "error");
        console.error(error);
      } finally {
       if (
         window.turnstile &&
         turnstileWidgetId !== null
       ) {
        window.turnstile.reset(turnstileWidgetId);
        }

       contactSubmitButton.disabled = false;
       contactSubmitButton.textContent =
       "Enviar mensaje";
      }
    }
  );
}
