const pool = require("../config/database");

async function createLead(req, res, next) {
  try {
    const { firstName, lastName, email, phone, message, vehicleId, source = "web" } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ message: "Nombre y correo son obligatorios" });
    }

    const [result] = await pool.execute(
      `INSERT INTO leads (first_name, last_name, email, phone, message, vehicle_id, source)
       VALUES (:firstName, :lastName, :email, :phone, :message, :vehicleId, :source)`,
      {
        firstName,
        lastName: lastName || null,
        email,
        phone: phone || null,
        message: message || null,
        vehicleId: vehicleId || null,
        source,
      }
    );

    return res.status(201).json({
      message: "Solicitud recibida correctamente",
      leadId: result.insertId,
    });
  } catch (error) {
    return next(error);
  }
}

async function listLeads(req, res, next) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = [];
    const params = { limit: Math.min(Number(limit) || 50, 100), offset: Number(offset) || 0 };

    if (status) {
      where.push("l.status = :status");
      params.status = status;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `SELECT l.*, CONCAT(v.brand, ' ', v.model) AS vehicle_name
       FROM leads l
       LEFT JOIN vehicles v ON v.id = l.vehicle_id
       ${whereSql}
       ORDER BY l.created_at DESC
       LIMIT :limit OFFSET :offset`,
      params
    );

    return res.json({ leads: rows });
  } catch (error) {
    return next(error);
  }
}

async function updateLeadStatus(req, res, next) {
  try {
    const allowed = ["new", "contacted", "qualified", "closed", "lost"];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const [result] = await pool.execute("UPDATE leads SET status = :status WHERE id = :id", {
      status,
      id: req.params.id,
    });

    if (!result.affectedRows) return res.status(404).json({ message: "Lead no encontrado" });
    return res.json({ message: "Estado actualizado" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createLead, listLeads, updateLeadStatus };
