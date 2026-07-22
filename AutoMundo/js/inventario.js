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
          <div class="card-badge">${escapeHtml(getConditionLabel(v.condition))}</div>
          <button class="btn-favorito ${isFavorite(v.id) ? "activo" : ""}" type="button" data-id="${v.id}" aria-label="${isFavorite(v.id) ? "Quitar de favoritos" : "Agregar a favoritos"}">
            ${isFavorite(v.id) ? "♥" : "♡"}
          </button>
          <img src="${escapeHtml(v.image)}" alt="${escapeHtml(v.name)}" loading="lazy">
        </div>
        <div class="card-content">
          <p class="card-version">${escapeHtml(v.version || getConditionLabel(v.condition))}</p>
          <h3>${escapeHtml(v.name)}</h3>

          <div class="vehicle-specs">
            <div class="vehicle-spec">
              <span>Año</span>
              <strong>${escapeHtml(v.year || "—")}</strong>
            </div>
            <div class="vehicle-spec">
              <span>Tipo</span>
              <strong>${escapeHtml(v.type || "—")}</strong>
            </div>
            <div class="vehicle-spec">
              <span>Kilometraje</span>
              <strong>${Number(v.mileage || 0).toLocaleString("es-VE")} km</strong>
            </div>
            <div class="vehicle-spec">
              <span>Transmisión</span>
              <strong>${escapeHtml(v.transmission || "—")}</strong>
            </div>
          </div>

          <div class="vehicle-card-footer">
            <p class="precio"><small>Precio</small>$${v.price.toLocaleString("en-US")}</p>
            <button class="btn-detalles" type="button" data-id="${v.id}">Ver detalles</button>
          </div>
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
  if (!vehicle || !elements.modal) return;

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const image = document.querySelector("#modalImagen");
  if (image) {
    image.src = vehicle.image;
    image.alt = vehicle.name;
  }

  setText("#modalVersion", vehicle.version || getConditionLabel(vehicle.condition));
  setText("#modalNombre", vehicle.name);
  setText("#modalMarca", `Marca: ${vehicle.brand || "—"}`);
  setText("#modalTipo", `Tipo: ${vehicle.type || "—"}`);
  setText("#modalAno", `Año: ${vehicle.year || "—"}`);
  setText("#modalCondicion", `Condición: ${getConditionLabel(vehicle.condition)}`);
  setText("#modalKilometraje", `Kilometraje: ${Number(vehicle.mileage || 0).toLocaleString("es-VE")} km`);
  setText("#modalCombustible", `Combustible: ${vehicle.fuel || "—"}`);
  setText("#modalTransmision", `Transmisión: ${vehicle.transmission || "—"}`);
  setText("#modalDescripcion", vehicle.description || "Consulta con un asesor para conocer todos los detalles de esta unidad.");
  setText("#modalPrecio", `$${vehicle.price.toLocaleString("en-US")}`);

  const whatsappLink = document.querySelector("#modalWhatsapp");
  if (whatsappLink) {
    const message = `Hola, quiero información sobre ${vehicle.name} (${vehicle.year}).`;
    whatsappLink.href = `https://wa.me/584247245512?text=${encodeURIComponent(message)}`;
  }

  elements.modal.classList.add("activo");
  document.body.style.overflow = "hidden";
  document.querySelector(".cerrar-modal")?.focus();
}

function closeModal() {
  if (!elements.modal) return;
  elements.modal.classList.remove("activo");
  document.body.style.overflow = "";
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
document.querySelector(".cerrar-modal")?.addEventListener("click", closeModal);
window.addEventListener("click", (event) => { if (event.target === elements.modal) closeModal(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.modal?.classList.contains("activo")) closeModal();
});

async function initializeInventory() {
  await Promise.all([syncFavorites(), loadBrands()]);
  await loadVehicles();
}

initializeInventory();
