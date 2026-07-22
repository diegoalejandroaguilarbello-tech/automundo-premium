const pool = require("../config/database");

const NAME_PATTERN =
  /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;

const PHONE_PATTERN =
  /^\+?[\d\s().-]+$/;

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstileToken(token) {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    const error = new Error(
      "La protección del formulario no está configurada."
    );
    error.status = 503;
    throw error;
  }

  if (
    typeof token !== "string" ||
    !token.trim() ||
    token.length > 2048
  ) {
    return false;
  }

  const verificationData =
    new URLSearchParams({
      secret: secretKey,
      response: token.trim(),
    });

  let cloudflareResponse;

  try {
    cloudflareResponse = await fetch(
      TURNSTILE_VERIFY_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: verificationData,
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch (cause) {
    const error = new Error(
      "El servicio de verificación no está disponible."
    );
    error.status = 503;
    error.cause = cause;
    throw error;
  }

  if (!cloudflareResponse.ok) {
    const error = new Error(
      "El servicio de verificación rechazó la solicitud."
    );
    error.status = 502;
    throw error;
  }

  const result =
    await cloudflareResponse.json();

  return result.success === true;
}


function normalizeSingleLine(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

function normalizeMessage(value) {
  return typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").trim()
    : "";
}

function isValidEmail(value) {
  if (!/^[^\s@]+@[^\s@]+$/.test(value)) {
    return false;
  }

  const [localPart, domain] = value.split("@");

  if (
    !localPart ||
    !domain ||
    localPart.length > 64 ||
    domain.length > 253
  ) {
    return false;
  }

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    domain.includes("..")
  ) {
    return false;
  }

  const labels = domain.split(".");

  if (
    labels.length < 2 ||
    labels[labels.length - 1].length < 2
  ) {
    return false;
  }

  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
      .test(label)
  );
}

function validateName(
  value,
  {
    required = false,
    label = "nombre",
  } = {}
) {
  if (!value) {
    return required
      ? `El ${label} es obligatorio.`
      : "";
  }

  if (value.length < 2) {
    return `El ${label} debe tener al menos 2 caracteres.`;
  }

  if (value.length > 100) {
    return `El ${label} no puede superar 100 caracteres.`;
  }

  const letterCount =
    (value.match(/\p{L}/gu) || []).length;

  if (
    !NAME_PATTERN.test(value) ||
    letterCount < 2
  ) {
    return `El ${label} contiene caracteres inválidos.`;
  }

  return "";
}

function validateLeadPayload(body = {}) {
  const data = {
    firstName:
      normalizeSingleLine(body.firstName),

    lastName:
      normalizeSingleLine(body.lastName),

    email:
      normalizeSingleLine(body.email)
        .toLowerCase(),

    phone:
      normalizeSingleLine(body.phone),

    message:
      normalizeMessage(body.message),

    source:
      normalizeSingleLine(body.source) || "web",

    vehicleId:
      body.vehicleId === undefined ||
      body.vehicleId === null ||
      body.vehicleId === ""
        ? null
        : Number(body.vehicleId),
  };

  const errors = {};

  const firstNameError = validateName(
    data.firstName,
    {
      required: true,
      label: "nombre",
    }
  );

  const lastNameError = validateName(
    data.lastName,
    {
      label: "apellido",
    }
  );

  if (firstNameError) {
    errors.firstName = firstNameError;
  }

  if (lastNameError) {
    errors.lastName = lastNameError;
  }

  if (!data.email) {
    errors.email =
      "El correo electrónico es obligatorio.";
  } else if (
    data.email.length > 180 ||
    !isValidEmail(data.email)
  ) {
    errors.email =
      "Ingresa un correo electrónico válido.";
  }

  if (data.phone) {
    const digitCount =
      data.phone.replace(/\D/g, "").length;

    if (
      !PHONE_PATTERN.test(data.phone) ||
      digitCount < 7 ||
      digitCount > 15
    ) {
      errors.phone =
        "Ingresa un número de teléfono válido.";
    }
  }

  const meaningfulCharacters =
    (
      data.message.match(
        /[\p{L}\p{N}]/gu
      ) || []
    ).length;

  if (!data.message) {
    errors.message =
      "El mensaje es obligatorio.";
  } else if (data.message.length < 10) {
    errors.message =
      "El mensaje debe tener al menos 10 caracteres.";
  } else if (data.message.length > 1000) {
    errors.message =
      "El mensaje no puede superar 1000 caracteres.";
  } else if (meaningfulCharacters < 5) {
    errors.message =
      "Escribe un mensaje con información suficiente.";
  }

  if (
    !/^[a-z0-9_-]{1,80}$/i.test(data.source)
  ) {
    errors.source =
      "Origen de solicitud inválido.";
  }

  if (
    data.vehicleId !== null &&
    (
      !Number.isInteger(data.vehicleId) ||
      data.vehicleId <= 0
    )
  ) {
    errors.vehicleId =
      "Vehículo inválido.";
  }

  return {
    data,
    errors,
  };
}

async function createLead(req, res, next) {
  try {
    const honeypotValue =
      normalizeSingleLine(req.body?.website);

    if (honeypotValue) {
       return res.status(201).json({
      message:
    "Solicitud recibida correctamente",
    });
    }

    const { data, errors } =
      validateLeadPayload(req.body);

    if (Object.keys(errors).length) {
      return res.status(422).json({
        message:
          "Corrige los campos indicados.",
        errors,
      });
    }

    const turnstileIsValid =
  await verifyTurnstileToken(
    req.body?.turnstileToken
  );

if (!turnstileIsValid) {
  return res.status(403).json({
    message:
      "No se pudo completar la verificación de seguridad.",
    errors: {
      turnstile:
        "Completa la verificación e intenta nuevamente.",
    },
  });
}

    if (data.vehicleId !== null) {
      const [vehicleRows] =
        await pool.execute(
          `
          SELECT id
          FROM vehicles
          WHERE id = :id
          LIMIT 1
          `,
          {
            id: data.vehicleId,
          }
        );

      if (!vehicleRows[0]) {
        return res.status(422).json({
          message:
            "Corrige los campos indicados.",
          errors: {
            vehicleId:
              "El vehículo seleccionado no existe.",
          },
        });
      }
    }

    const [result] = await pool.execute(
      `
      INSERT INTO leads (
        first_name,
        last_name,
        email,
        phone,
        message,
        vehicle_id,
        source
      )
      VALUES (
        :firstName,
        :lastName,
        :email,
        :phone,
        :message,
        :vehicleId,
        :source
      )
      `,
      {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        vehicleId: data.vehicleId,
        source: data.source,
      }
    );

    return res.status(201).json({
      message:
        "Solicitud recibida correctamente",
    });
  } catch (error) {
    return next(error);
  }
}

async function listLeads(req, res, next) {
  try {
    const {
      status,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = [];

    // Railway/MySQL rechaza en algunos entornos LIMIT/OFFSET como
    // parámetros de sentencias preparadas. Se normalizan como enteros
    // antes de interpolarlos para mantener la consulta segura.
    const safeLimit = Math.min(
      Math.max(Math.trunc(Number(limit)) || 50, 1),
      100
    );
    const safeOffset = Math.max(
      Math.trunc(Number(offset)) || 0,
      0
    );

    const params = {};

    if (status) {
      where.push("l.status = :status");
      params.status = status;
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const [rows] = await pool.execute(
      `
      SELECT
        l.*,
        CONCAT(
          v.brand,
          ' ',
          v.model
        ) AS vehicle_name
      FROM leads l
      LEFT JOIN vehicles v
        ON v.id = l.vehicle_id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
      `,
      params
    );

    return res.json({
      leads: rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateLeadStatus(
  req,
  res,
  next
) {
  try {
    const allowed = [
      "new",
      "contacted",
      "qualified",
      "closed",
      "lost",
    ];

    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Estado inválido",
      });
    }

    const [result] = await pool.execute(
      `
      UPDATE leads
      SET status = :status
      WHERE id = :id
      `,
      {
        status,
        id: req.params.id,
      }
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Lead no encontrado",
      });
    }

    return res.json({
      message: "Estado actualizado",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createLead,
  listLeads,
  updateLeadStatus,
};
