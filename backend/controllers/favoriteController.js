const pool = require("../config/database");

async function listFavorites(req, res, next) {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "El parámetro session_id es obligatorio" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM favoritos WHERE session_id = ? ORDER BY agregado_en DESC",
      [sessionId]
    );

    return res.json({ favoritos: rows });
  } catch (error) {
    return next(error);
  }
}

async function addFavorite(req, res, next) {
  try {
    const sessionId = req.body.session_id || req.body.sessionId;
    const vehiculoId = req.body.vehiculo_id || req.body.vehiculoId || req.body.vehicleId || req.body.id;

    if (!sessionId || !vehiculoId) {
      return res.status(400).json({ message: "Los campos session_id y vehiculo_id son obligatorios" });
    }

    // Verificar si el vehículo existe
    const [vehicles] = await pool.execute("SELECT id FROM vehicles WHERE id = ?", [vehiculoId]);
    if (!vehicles.length) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    // Verificar si ya está en favoritos
    const [existing] = await pool.execute(
      "SELECT id FROM favoritos WHERE session_id = ? AND vehiculo_id = ?",
      [sessionId, vehiculoId]
    );

    if (existing.length) {
      return res.status(200).json({ message: "El vehículo ya se encuentra en favoritos" });
    }

    const [result] = await pool.execute(
      "INSERT INTO favoritos (session_id, vehiculo_id) VALUES (?, ?)",
      [sessionId, vehiculoId]
    );

    return res.status(201).json({
      message: "Vehículo agregado a favoritos",
      id: result.insertId,
    });
  } catch (error) {
    return next(error);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const vehiculoId = req.params.vehiculo_id || req.body.vehiculo_id || req.query.vehiculo_id;
    const sessionId = req.body.session_id || req.query.session_id || req.query.sessionId;

    if (!sessionId || !vehiculoId) {
      return res.status(400).json({ message: "Los campos session_id y vehiculo_id son obligatorios" });
    }

    const [result] = await pool.execute(
      "DELETE FROM favoritos WHERE session_id = ? AND vehiculo_id = ?",
      [sessionId, vehiculoId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "El vehículo no estaba en favoritos" });
    }

    return res.json({ message: "Vehículo eliminado de favoritos" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
