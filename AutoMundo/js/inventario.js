// Inventario renderizado desde la API con filtros y paginación en servidor.
const API_BASE_URL = window.AUTOMUNDO_API_BASE_URL || `${window.location.origin}/api`;
const PAGE_SIZE = 6;

const state = { vehicles: [], page: 1, total: 0, totalPages: 0, loading: false };
const elements = {
  container: document.querySelector("#contenedorVehiculos"),
  counter: document.querySelector("#contadorVehiculos"),
  searchForm: document.querySelector("#formBuscarVehiculo"),
  search: document.querySelector("#buscarVehiculo"),
  brand: document.querySelector("#marca"),
  model: document.querySelector("#modelo"),
  type: document.querySelector("#tipo"),
  price: document.querySelector("#precio"),
  modal: document.querySelector("#modalVehiculo"),
  loadMore: document.querySelector("#btnCargar"),
};

function getSessionId() {
  let id = localStorage.getItem("automundo_session_id");
  if (!id) {
    id = `session_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    localStorage.setItem("automundo_session_id", id);
  }
  return id;
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("automundo_favoritos")) || []; }
  catch { return []; }
}

function saveFavorites(ids) {
  localStorage.setItem("automundo_favoritos", JSON.stringify(ids));
}

function isFavorite(id) { return getFavorites().includes(Number(id)); }

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function assetUrl(path) {
  if (!path) return "img/hero-car.png";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${window.location.origin}${path}`;
  return path;
}

function normalizeVehicle(v) {
  return {
    ...v,
    name: `${v.brand} ${v.model}`,
    image: assetUrl(v.imageUrl),
    price: Number(v.price),
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

async function syncFavorites() {
  try {
    const data = await fetchJson(`${API_BASE_URL}/favoritos?session_id=${encodeURIComponent(getSessionId())}`);
    saveFavorites((data.favoritos || []).map((favorite) => Number(favorite.vehiculo_id)));
  } catch (error) {
    console.warn("Favoritos disponibles solo en este navegador:", error.message);
  }
}

async function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(Number(id));
  const sessionId = getSessionId();
  if (index === -1) {
    favorites.push(Number(id));
    saveFavorites(favorites);
    await fetchJson(`${API_BASE_URL}/favoritos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, vehiculo_id: id }),
    }).catch(() => null);
  } else {
    favorites.splice(index, 1);
    saveFavorites(favorites);
    await fetchJson(`${API_BASE_URL}/favoritos/${id}?session_id=${encodeURIComponent(sessionId)}`, { method: "DELETE" }).catch(() => null);
  }
  renderVehicles();
}

function buildQuery(page) {
  const query = new URLSearchParams({ page, pageSize: PAGE_SIZE, status: "available" });
  const search = elements.search.value.trim();
  if (search) query.set("search", search);
  if (elements.brand.value) query.set("brandId", elements.brand.value);
  if (elements.model.value) query.set("modelId", elements.model.value);
  if (elements.type.value) query.set("type", elements.type.value);
  if (elements.price.value) {
    const [min, max] = elements.price.value.split("-");
    if (min) query.set("minPrice", min);
    if (max) query.set("maxPrice", max);
  }
  return query;
}

async function loadVehicles({ append = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  elements.loadMore.disabled = true;
  if (!append) {
    state.page = 1;
    elements.container.innerHTML = '<p class="estado-inventario">Cargando inventario...</p>';
  }
  try {
    const data = await fetchJson(`${API_BASE_URL}/vehicles?${buildQuery(state.page)}`);
    const incoming = (data.vehicles || []).map(normalizeVehicle);
    state.vehicles = append ? [...state.vehicles, ...incoming] : incoming;
    state.total = data.pagination.total;
    state.totalPages = data.pagination.totalPages;
    renderVehicles();
  } catch (error) {
    if (!append) state.vehicles = [];
    elements.container.innerHTML = `<p class="estado-inventario error">No se pudo cargar el inventario. ${escapeHtml(error.message)}</p>`;
    elements.counter.textContent = "0";
    elements.loadMore.hidden = true;
  } finally {
    state.loading = false;
    elements.loadMore.disabled = false;
  }
}

function getConditionLabel(condition) {
  const labels = {
    new: "Nuevo",
    used: "Usado",
    certified: "Certificado"
  };

  return labels[condition] || "No especificada";
}

function renderVehicles() {
  elements.counter.textContent = state.total;
  if (!state.vehicles.length) {
    elements.container.innerHTML = '<p class="estado-inventario">No encontramos vehículos con esos filtros.</p>';
  } else {
    elements.container.innerHTML = state.vehicles.map((v) => `
      <article class="card-premium">
        <div class="card-imagen">
          <div class="card-badge">${v.condition === "new" ? "Nuevo" : "Certificado"}</div>
          <button class="btn-favorito ${isFavorite(v.id) ? "activo" : ""}" data-id="${v.id}" aria-label="Cambiar favorito">
            ${isFavorite(v.id) ? "♥" : "♡"}
          </button>
          <img src="${escapeHtml(v.image)}" alt="${escapeHtml(v.name)}" loading="lazy">
        </div>
        <div class="card-content">
  <h3>${escapeHtml(v.name)}</h3>

  <p class="card-version">
    ${escapeHtml(v.version || "Versión no especificada")}
  </p>

  <div class="vehicle-specs">
    <div class="vehicle-spec">
      <span>Año</span>
      <strong>${escapeHtml(v.year || "No especificado")}</strong>
    </div>

    <div class="vehicle-spec">
      <span>Tipo</span>
      <strong>${escapeHtml(v.type || "No especificado")}</strong>
    </div>

    <div class="vehicle-spec">
      <span>Condición</span>
      <strong>${escapeHtml(getConditionLabel(v.condition))}</strong>
    </div>

    <div class="vehicle-spec">
      <span>Kilometraje</span>
      <strong>
        ${Number(v.mileage || 0).toLocaleString("es-VE")} km
      </strong>
    </div>

    <div class="vehicle-spec">
      <span>Combustible</span>
      <strong>${escapeHtml(v.fuel || "No especificado")}</strong>
    </div>

    <div class="vehicle-spec">
      <span>Transmisión</span>
      <strong>${escapeHtml(v.transmission || "No especificada")}</strong>
    </div>
  </div>

  <p class="card-description">
    ${escapeHtml(v.description || "Descripción no disponible.")}
  </p>

  <div class="precio">
    $${v.price.toLocaleString("en-US")}
  </div>

  <button class="btn-detalles" data-id="${v.id}">
    Ver detalles
  </button>
</div>
      </article>`).join("");
  }
  elements.loadMore.hidden = state.page >= state.totalPages;
}

async function loadBrands() {
  const data = await fetchJson(`${API_BASE_URL}/catalog/brands`);
  elements.brand.innerHTML = '<option value="">Todas las marcas</option>' +
    data.brands.map((brand) => `<option value="${brand.id}">${escapeHtml(brand.name)}</option>`).join("");
}

async function loadModels() {
  const brandId = elements.brand.value;
  elements.model.disabled = !brandId;
  elements.model.innerHTML = '<option value="">Todos los modelos</option>';
  if (!brandId) return;
  const data = await fetchJson(`${API_BASE_URL}/catalog/models?brandId=${encodeURIComponent(brandId)}`);
  elements.model.innerHTML += data.models.map((model) => `<option value="${model.id}">${escapeHtml(model.name)}</option>`).join("");
}

function openModal(vehicle) {
  elements.modal.style.display = "flex";
  document.querySelector("#modalImagen").src = vehicle.image;
  document.querySelector("#modalNombre").textContent = vehicle.name;
  document.querySelector("#modalMarca").textContent = `Marca: ${vehicle.brand}`;
  document.querySelector("#modalTipo").textContent = `Tipo: ${vehicle.type}`;
  document.querySelector("#modalAno").textContent = `Año: ${vehicle.year}`;
  document.querySelector("#modalPrecio").textContent = `$${vehicle.price.toLocaleString("en-US")}`;
}

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadVehicles();
});

elements.search.addEventListener("search", () => {
  if (!elements.search.value.trim()) {
    loadVehicles();
  }
});
elements.brand.addEventListener("change", async () => { await loadModels(); await loadVehicles(); });
elements.model.addEventListener("change", () => loadVehicles());
[elements.type, elements.price].forEach((element) => element.addEventListener("change", () => loadVehicles()));
elements.loadMore.addEventListener("click", async () => { state.page += 1; await loadVehicles({ append: true }); });
elements.container.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".btn-favorito");
  if (favoriteButton) return toggleFavorite(Number(favoriteButton.dataset.id));
  const detailsButton = event.target.closest(".btn-detalles");
  if (detailsButton) openModal(state.vehicles.find((v) => v.id === Number(detailsButton.dataset.id)));
});
document.querySelector(".cerrar-modal").addEventListener("click", () => { elements.modal.style.display = "none"; });
window.addEventListener("click", (event) => { if (event.target === elements.modal) elements.modal.style.display = "none"; });

async function initializeInventory() {
  await Promise.all([syncFavorites(), loadBrands()]);
  await loadVehicles();
}

initializeInventory();
