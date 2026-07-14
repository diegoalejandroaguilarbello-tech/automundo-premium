const API_URL = window.AUTOMUNDO_API_BASE_URL || "http://localhost:3000/api";

const welcomeMessage = document.getElementById("welcomeMessage");
const logoutButton = document.getElementById("logoutButton");
const vehiclesTableBody = document.getElementById("vehiclesTableBody");
const refreshVehiclesButton = document.getElementById("refreshVehiclesButton");
const vehicleForm = document.getElementById("vehicleForm");
const vehicleFormMessage = document.getElementById("vehicleFormMessage");
const submitVehicleButton = document.getElementById("submitVehicleButton");
const cancelEditVehicleButton = document.getElementById("cancelEditVehicleButton");
const leadsTableBody = document.getElementById("leadsTableBody");
const quotesTableBody = document.getElementById("quotesTableBody");
const refreshLeadsButton = document.getElementById("refreshLeadsButton");
const refreshQuotesButton = document.getElementById("refreshQuotesButton");

let editingVehicleId = null;
let vehiclesCache = [];

function getToken() {
  return localStorage.getItem("adminToken");
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    Authorization: `Bearer ${token || ""}`,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function redirectToLogin() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  window.location.href = "admin.html";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatMileage(value) {
  return `${Number(value || 0).toLocaleString("en-US")} km`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusLabel(status) {
  const labels = {
    available: "Disponible",
    reserved: "Reservado",
    sold: "Vendido",
    maintenance: "Mantenimiento",
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Calificado",
    closed: "Cerrado",
    lost: "Perdido",
  };
  return labels[status] || status || "Sin estado";
}

function getStatusClass(status) {
  const classes = {
    available: "status-available",
    reserved: "status-reserved",
    sold: "status-sold",
    maintenance: "status-maintenance",
    new: "status-reserved",
    contacted: "status-available",
    qualified: "status-available",
    closed: "status-sold",
    lost: "status-sold",
  };
  return classes[status] || "";
}

function showVehicleFormMessage(text, type = "error") {
  if (!vehicleFormMessage) return;
  vehicleFormMessage.textContent = text;
  vehicleFormMessage.className = `message ${type}`;
}

async function verifySession() {
  if (!getToken()) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: authHeaders(),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Sesión inválida");
    }

    if (welcomeMessage) {
      welcomeMessage.textContent = `Bienvenido, ${data.user.name} (${data.user.role})`;
    }

    await Promise.allSettled([loadVehicles(), loadLeads(), loadQuotes()]);
  } catch (error) {
    console.error(error);
    redirectToLogin();
  }
}

async function loadVehicles() {
  if (!vehiclesTableBody) return;

  vehiclesTableBody.innerHTML = `<tr><td colspan="6">Cargando vehículos...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/admin/vehicles?limit=100&status=all`, {
      headers: authHeaders(),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "No se pudieron cargar los vehículos");
    }

    vehiclesCache = data.vehicles || [];
    renderVehicles(vehiclesCache);
  } catch (error) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-error">${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
}

function renderVehicles(vehicles) {
  if (!vehiclesTableBody) return;

  if (!vehicles.length) {
    vehiclesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">No hay vehículos registrados.</td>
      </tr>
    `;
    return;
  }

  vehiclesTableBody.innerHTML = vehicles
    .map((vehicle) => {
      const vehicleName = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
      const version = vehicle.version ? vehicle.version : "Sin versión";
      const statusLabel = getStatusLabel(vehicle.status);
      const statusClass = getStatusClass(vehicle.status);

      return `
        <tr>
          <td>
            <span class="vehicle-name">${escapeHtml(vehicleName)}</span>
            <span class="vehicle-detail">${escapeHtml(version)} · ${escapeHtml(vehicle.type || "")}</span>
          </td>
          <td>${escapeHtml(vehicle.year)}</td>
          <td>${formatMoney(vehicle.price)}</td>
          <td>${formatMileage(vehicle.mileage)}</td>
          <td><span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
          <td class="table-actions">
            <button type="button" class="mini-btn" data-action="edit" data-id="${vehicle.id}">Editar</button>
            <button type="button" class="mini-btn danger" data-action="delete" data-id="${vehicle.id}">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function setFormValue(name, value) {
  const field = vehicleForm?.elements?.[name];
  if (field) field.value = value ?? "";
}

function startEditVehicle(vehicleId) {
  const vehicle = vehiclesCache.find((item) => String(item.id) === String(vehicleId));
  if (!vehicle || !vehicleForm) return;

  editingVehicleId = vehicle.id;
  setFormValue("brand", vehicle.brand);
  setFormValue("model", vehicle.model);
  setFormValue("version", vehicle.version);
  setFormValue("year", vehicle.year);
  setFormValue("type", vehicle.type);
  setFormValue("condition", vehicle.condition);
  setFormValue("price", vehicle.price);
  setFormValue("mileage", vehicle.mileage);
  setFormValue("fuel", vehicle.fuel);
  setFormValue("transmission", vehicle.transmission);
  setFormValue("color", vehicle.color);
  setFormValue("status", vehicle.status);
  setFormValue("description", vehicle.description);

  if (submitVehicleButton) submitVehicleButton.textContent = "Actualizar vehículo";
  if (cancelEditVehicleButton) cancelEditVehicleButton.classList.remove("hidden");
  showVehicleFormMessage(`Editando ${vehicle.brand} ${vehicle.model}.`, "success");
  vehicleForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditVehicle() {
  editingVehicleId = null;
  if (vehicleForm) vehicleForm.reset();
  if (submitVehicleButton) submitVehicleButton.textContent = "Guardar vehículo";
  if (cancelEditVehicleButton) cancelEditVehicleButton.classList.add("hidden");
  showVehicleFormMessage("", "success");
}

async function deleteVehicle(vehicleId) {
  const vehicle = vehiclesCache.find((item) => String(item.id) === String(vehicleId));
  const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : "este vehículo";

  if (!confirm(`¿Seguro que deseas eliminar ${name}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/vehicles/${vehicleId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "No se pudo eliminar el vehículo");
    }

    if (String(editingVehicleId) === String(vehicleId)) cancelEditVehicle();
    await loadVehicles();
  } catch (error) {
    alert(error.message);
  }
}

async function saveVehicle(event) {
  event.preventDefault();

  if (!getToken()) {
    redirectToLogin();
    return;
  }

  const formData = new FormData(vehicleForm);
  showVehicleFormMessage(editingVehicleId ? "Actualizando vehículo..." : "Guardando vehículo...", "success");

  const url = editingVehicleId
    ? `${API_URL}/admin/vehicles/${editingVehicleId}`
    : `${API_URL}/admin/vehicles`;

  const method = editingVehicleId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: authHeaders(),
      body: formData,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "No se pudo guardar el vehículo");
    }

    showVehicleFormMessage(editingVehicleId ? "Vehículo actualizado correctamente." : "Vehículo guardado correctamente.", "success");
    cancelEditVehicle();
    await loadVehicles();
  } catch (error) {
    showVehicleFormMessage(error.message, "error");
  }
}

async function loadLeads() {
  if (!leadsTableBody) return;

  leadsTableBody.innerHTML = `<tr><td colspan="7">Cargando clientes interesados...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/leads?limit=100`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(response);

    if (!response.ok) throw new Error(data.message || "No se pudieron cargar los leads");

    renderLeads(data.leads || []);
  } catch (error) {
    leadsTableBody.innerHTML = `<tr><td colspan="7" class="table-error">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderLeads(leads) {
  if (!leads.length) {
    leadsTableBody.innerHTML = `<tr><td colspan="7" class="table-empty">No hay clientes interesados registrados.</td></tr>`;
    return;
  }

  leadsTableBody.innerHTML = leads.map((lead) => `
    <tr>
      <td>${escapeHtml(`${lead.first_name || ""} ${lead.last_name || ""}`.trim())}</td>
      <td>${escapeHtml(lead.email)}</td>
      <td>${escapeHtml(lead.phone || "-")}</td>
      <td>${escapeHtml(lead.vehicle_name || "General")}</td>
      <td>${escapeHtml(lead.source || "web")}</td>
      <td>
        <select class="status-select" data-lead-id="${lead.id}">
          ${["new", "contacted", "qualified", "closed", "lost"].map((status) => `
            <option value="${status}" ${lead.status === status ? "selected" : ""}>${getStatusLabel(status)}</option>
          `).join("")}
        </select>
      </td>
      <td>${formatDate(lead.created_at)}</td>
    </tr>
  `).join("");
}

async function updateLeadStatus(leadId, status) {
  try {
    const response = await fetch(`${API_URL}/leads/${leadId}/status`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });

    const data = await parseResponse(response);

    if (!response.ok) throw new Error(data.message || "No se pudo actualizar el estado");
  } catch (error) {
    alert(error.message);
    await loadLeads();
  }
}

async function loadQuotes() {
  if (!quotesTableBody) return;

  quotesTableBody.innerHTML = `<tr><td colspan="7">Cargando cotizaciones...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/quotes`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(response);

    if (!response.ok) throw new Error(data.message || "No se pudieron cargar las cotizaciones");

    renderQuotes(data.quotes || []);
  } catch (error) {
    quotesTableBody.innerHTML = `<tr><td colspan="7" class="table-error">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderQuotes(quotes) {
  if (!quotes.length) {
    quotesTableBody.innerHTML = `<tr><td colspan="7" class="table-empty">No hay cotizaciones registradas.</td></tr>`;
    return;
  }

  quotesTableBody.innerHTML = quotes.map((quote) => `
    <tr>
      <td>${escapeHtml(quote.full_name)}</td>
      <td>${escapeHtml(quote.email)}</td>
      <td>${escapeHtml(quote.phone || "-")}</td>
      <td>${escapeHtml(quote.vehicle_name || "General")}</td>
      <td>${formatMoney(quote.vehicle_price)}</td>
      <td>${escapeHtml(quote.months)} meses</td>
      <td>${formatMoney(quote.monthly_payment)}</td>
    </tr>
  `).join("");
}

if (logoutButton) {
  logoutButton.addEventListener("click", redirectToLogin);
}

if (refreshVehiclesButton) {
  refreshVehiclesButton.addEventListener("click", loadVehicles);
}

if (refreshLeadsButton) {
  refreshLeadsButton.addEventListener("click", loadLeads);
}

if (refreshQuotesButton) {
  refreshQuotesButton.addEventListener("click", loadQuotes);
}

if (vehicleForm) {
  vehicleForm.addEventListener("submit", saveVehicle);
  vehicleForm.addEventListener("reset", () => {
    window.setTimeout(cancelEditVehicle, 0);
  });
}

if (cancelEditVehicleButton) {
  cancelEditVehicleButton.addEventListener("click", cancelEditVehicle);
}

if (vehiclesTableBody) {
  vehiclesTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "edit") startEditVehicle(id);
    if (action === "delete") deleteVehicle(id);
  });
}

if (leadsTableBody) {
  leadsTableBody.addEventListener("change", (event) => {
    const select = event.target.closest(".status-select");
    if (!select) return;
    updateLeadStatus(select.dataset.leadId, select.value);
  });
}

verifySession();
