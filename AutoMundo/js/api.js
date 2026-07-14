// Configuración central de la API AutoMundo.
// Si el frontend se abre con el backend Express, usa /api.
// Si se abre como archivo local o desde Live Server, usa http://localhost:3000/api.
(function () {
  const isFile = window.location.protocol === "file:";
  const isStaticDevServer = ["127.0.0.1", "localhost"].includes(window.location.hostname) && !["3000", ""].includes(window.location.port);

  window.AUTOMUNDO_API_BASE_URL = window.AUTOMUNDO_API_BASE_URL || (
    isFile || isStaticDevServer
      ? "http://localhost:3000/api"
      : `${window.location.origin}/api`
  );

  window.automundoAssetUrl = function automundoAssetUrl(path) {
    if (!path) return "img/hero-car.png";
    if (String(path).startsWith("http")) return path;
    if (String(path).startsWith("/uploads")) {
      return window.AUTOMUNDO_API_BASE_URL.replace(/\/api$/, "") + path;
    }
    return path;
  };
})();
