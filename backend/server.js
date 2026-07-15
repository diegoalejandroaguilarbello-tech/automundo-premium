const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leadRoutes = require("./routes/leadRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const catalogRoutes = require("./routes/catalogRoutes");

const app = express();

app.disable("x-powered-by");
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "production" ? [] : devOrigins),
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== "production") {
      try {
        const url = new URL(origin);
        if (["localhost", "127.0.0.1"].includes(url.hostname)) {
          return callback(null, true);
        }
      } catch (error) {
        return callback(null, true);
      }
    }

    return callback(new Error("Origen no permitido por CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api", (req, res) => {
  res.status(200).json({
    proyecto: "AutoMundo Premium",
    version: "1.0.0",
    estado: "API funcionando correctamente",
    endpoints: ["/api/vehicles", "/api/leads", "/api/quotes", "/api/auth/login"],
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vehiculos", vehicleRoutes); // Alias en español para la rúbrica (Criterio 3.1)
app.use("/api/catalog", catalogRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/favoritos", favoriteRoutes); // Endpoint de favoritos (Criterio 3.2)

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Ruta de API no encontrada" });
});

// Permite desplegar frontend y backend juntos en un solo servicio.
const frontendPath = path.join(__dirname, "..", "AutoMundo");
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.status(404).sendFile(path.join(frontendPath, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: status === 500 ? "Error interno del servidor" : error.message,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
