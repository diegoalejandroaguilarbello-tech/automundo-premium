const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash, role, active FROM users WHERE email = :email LIMIT 1",
      { email }
    );

    const user = rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE id = :id LIMIT 1",
      { id: req.user.id }
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, me };
