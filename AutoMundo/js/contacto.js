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
const API_BASE_URL = window.AUTOMUNDO_API_BASE_URL || "http://localhost:3000/api";

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const fullName = String(formData.get("fullName") || "").trim();
    const [firstName, ...lastNameParts] = fullName.split(" ");

    const payload = {
      firstName,
      lastName: lastNameParts.join(" "),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
      source: "contacto-web"
    };

    contactFormStatus.textContent = "Enviando solicitud...";

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo enviar el mensaje");

      contactForm.reset();
      contactFormStatus.textContent = "Mensaje enviado correctamente. Te contactaremos pronto.";
    } catch (error) {
      contactFormStatus.textContent = "No se pudo enviar el mensaje. Revisa que el backend esté activo.";
      console.error(error);
    }
  });
}
