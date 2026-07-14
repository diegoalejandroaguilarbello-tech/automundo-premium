const API_URL = "http://localhost:3000/api";

/* =========================
   ELEMENTOS DOM (SEGUROS)
========================= */
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const welcomeMessage = document.getElementById("welcomeMessage");
const logoutButton = document.getElementById("logoutButton");

const vehiclesTableBody = document.getElementById("vehiclesTableBody");
const refreshVehiclesButton = document.getElementById("refreshVehiclesButton");

/* =========================
   HELPERS
========================= */
function showMessage(text, type = "error") {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.className = `message ${type}`;
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US")}`;
}

function formatMileage(value) {
  return `${Number(value || 0).toLocaleString("en-US")} km`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   DASHBOARD
========================= */
function showDashboard(user) {
  if (loginSection) loginSection.classList.add("hidden");
  if (dashboardSection) dashboardSection.classList.remove("hidden");

  if (welcomeMessage) {
    welcomeMessage.textContent = `Bienvenido, ${user.name} (${user.role})`;
  }

  loadVehicles();
}

function showLogin() {
  if (dashboardSection) dashboardSection.classList.add("hidden");
  if (loginSection) loginSection.classList.remove("hidden");
}

/* =========================
   SESSION
========================= */
async function verifySession() {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    showLogin();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      localStorage.removeItem("adminToken");
      showLogin();
      return;
    }

    const data = await response.json();
    showDashboard(data.user);

  } catch (error) {
    console.error(error);
    showLogin();
  }
}

/* =========================
   VEHICLES
========================= */
async function loadVehicles() {
  if (!vehiclesTableBody) return;

  vehiclesTableBody.innerHTML = `
    <tr>
      <td colspan="5">Cargando vehículos...</td>
    </tr>
  `;

  try {
    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API_URL}/admin/vehicles?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token || ""}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error cargando vehículos");
    }

    renderVehicles(data.vehicles || []);

  } catch (error) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="5">${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
}

/* =========================
   RENDER
========================= */
function renderVehicles(vehicles) {
  if (!vehiclesTableBody) return;

  if (!vehicles.length) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="5">No hay vehículos registrados</td>
      </tr>
    `;
    return;
  }

  vehiclesTableBody.innerHTML = vehicles.map(v => `
    <tr>
      <td>
        <span>${escapeHtml(v.brand)} ${escapeHtml(v.model)}</span><br>
        <small>${escapeHtml(v.version || "Sin versión")} · ${escapeHtml(v.type || "")}</small>
      </td>
      <td>${escapeHtml(v.year)}</td>
      <td>${formatMoney(v.price)}</td>
      <td>${formatMileage(v.mileage)}</td>
      <td>${escapeHtml(v.status || "available")}</td>
    </tr>
  `).join("");
}

/* =========================
   LOGIN
========================= */
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    showMessage("Validando...", "success");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "Error login", "error");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      showDashboard(data.user);

    } catch (error) {
      console.error(error);
      showMessage("Error de conexión", "error");
    }
  });
}

/* =========================
   LOGOUT
========================= */
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    showLogin();
  });
}

/* =========================
   REFRESH
========================= */
if (refreshVehiclesButton) {
  refreshVehiclesButton.addEventListener("click", loadVehicles);
}

/* =========================
   INIT
========================= */
verifySession();