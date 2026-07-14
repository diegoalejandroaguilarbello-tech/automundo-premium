const precio = document.getElementById("precio");
const entrada = document.getElementById("entrada");
const meses = document.getElementById("meses");
const interes = document.getElementById("interes");

const precioValue = document.getElementById("precioValue");
const entradaValue = document.getElementById("entradaValue");
const interesValue = document.getElementById("interesValue");
const cuota = document.getElementById("cuota");

const quoteForm = document.getElementById("quoteForm");
const quoteFormStatus = document.getElementById("quoteFormStatus");
const API_BASE_URL = window.AUTOMUNDO_API_BASE_URL || "http://localhost:3000/api";

function getSimulation() {
  const vehiclePrice = Number(precio?.value || 0);
  const downPaymentPercentage = Number(entrada?.value || 0);
  const months = Number(meses?.value || 0);
  const annualInterestRate = Number(interes?.value || 0);
  const downPayment = vehiclePrice * downPaymentPercentage / 100;
  const financedAmount = vehiclePrice - downPayment;
  const monthlyRate = annualInterestRate / 100 / 12;

  const monthlyPayment = monthlyRate === 0
    ? financedAmount / months
    : (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  return {
    vehiclePrice,
    downPayment,
    months,
    annualInterestRate,
    monthlyPayment,
  };
}

function calcular() {
  const simulation = getSimulation();
  cuota.innerText = "$ " + Number(simulation.monthlyPayment || 0).toFixed(2);
}

function actualizar() {
  precioValue.innerText = "$ " + Number(precio.value).toLocaleString("en-US");
  entradaValue.innerText = entrada.value + "%";
  interesValue.innerText = interes.value + "%";
}

[precio, entrada, meses, interes].forEach(el => {
  el.addEventListener("input", () => {
    actualizar();
    calcular();
  });
  el.addEventListener("change", () => {
    actualizar();
    calcular();
  });
});

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(quoteForm);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      ...getSimulation(),
    };

    if (!payload.fullName || !payload.email) {
      quoteFormStatus.textContent = "Nombre y correo son obligatorios.";
      return;
    }

    quoteFormStatus.textContent = "Enviando solicitud...";

    try {
      const response = await fetch(`${API_BASE_URL}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo enviar la cotización");

      quoteForm.reset();
      quoteFormStatus.textContent = `Solicitud enviada. Cuota estimada: $${Number(data.monthlyPayment || payload.monthlyPayment).toLocaleString("en-US")}`;
    } catch (error) {
      console.error(error);
      quoteFormStatus.textContent = "No se pudo enviar la solicitud. Verifica que el backend esté activo.";
    }
  });
}

actualizar();
calcular();
