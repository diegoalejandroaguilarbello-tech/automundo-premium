const pool = require("../config/database");

async function subscribe(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "El correo es obligatorio" });

    await pool.execute(
      `INSERT INTO newsletter_subscribers (email) VALUES (:email)
       ON DUPLICATE KEY UPDATE active = TRUE, updated_at = CURRENT_TIMESTAMP`,
      { email }
    );

    return res.status(201).json({ message: "Suscripción registrada" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { subscribe };
