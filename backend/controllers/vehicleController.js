const pool = require("../config/database");

function toVehicle(row) {
  return {
    id: row.id,
    brand: row.catalog_brand || row.brand,
    brandId: row.brand_id || null,
    model: row.catalog_model || row.model,
    modelId: row.model_id || null,
    version: row.version,
    year: row.year,
    type: row.type,
    condition: row.vehicle_condition,
    price: Number(row.price),
    mileage: row.mileage,
    fuel: row.fuel,
    transmission: row.transmission,
    color: row.color,
    description: row.description,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listVehicles(req, res, next) {
  try {
    const {
      search = "",
      brand,
      brandId,
      modelId,
      type,
      status = "available",
      minPrice,
      maxPrice,
      page = 1,
      pageSize = 6,
    } = req.query;

    const where = [];
    const params = {
      search: `%${search}%`,
      limit: Math.min(Math.max(Number(pageSize) || 6, 1), 24),
    };
    const currentPage = Math.max(Number(page) || 1, 1);
    params.offset = (currentPage - 1) * params.limit;

    if (search) {
      where.push("(b.name LIKE :search OR vm.name LIKE :search OR v.version LIKE :search OR v.description LIKE :search)");
    }
    if (brand) {
      where.push("b.name = :brand");
      params.brand = brand;
    }
    if (brandId) {
      where.push("b.id = :brandId");
      params.brandId = Number(brandId);
    }
    if (modelId) {
      where.push("vm.id = :modelId");
      params.modelId = Number(modelId);
    }
    if (type) {
      where.push("v.type = :type");
      params.type = type;
    }
    if (status && status !== "all") {
      where.push("v.status = :status");
      params.status = status;
    }
    if (minPrice) {
      where.push("v.price >= :minPrice");
      params.minPrice = Number(minPrice);
    }
    if (maxPrice) {
      where.push("v.price <= :maxPrice");
      params.maxPrice = Number(maxPrice);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `SELECT v.*, b.name AS catalog_brand, vm.name AS catalog_model
       FROM vehicles v
       INNER JOIN vehicle_models vm ON vm.id = v.model_id
       INNER JOIN brands b ON b.id = vm.brand_id
       ${whereSql}
       ORDER BY v.created_at DESC, v.id DESC
       LIMIT ${params.limit} OFFSET ${params.offset}`,
       params
    );

    const { limit: _limit, offset: _offset, ...countParams } = params;
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM vehicles v
       INNER JOIN vehicle_models vm ON vm.id = v.model_id
       INNER JOIN brands b ON b.id = vm.brand_id
       ${whereSql}`,
      countParams
    );

    const total = Number(countRows[0].total);
    return res.json({
      total,
      vehicles: rows.map(toVehicle),
      pagination: {
        page: currentPage,
        pageSize: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        hasNextPage: currentPage * params.limit < total,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getVehicle(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, b.name AS catalog_brand, vm.name AS catalog_model
       FROM vehicles v
       INNER JOIN vehicle_models vm ON vm.id = v.model_id
       INNER JOIN brands b ON b.id = vm.brand_id
       WHERE v.id = :id LIMIT 1`, {
      id: req.params.id,
    });

    if (!rows[0]) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    return res.json({ vehicle: toVehicle(rows[0]) });
  } catch (error) {
    return next(error);
  }
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveModelId(connection, brand, model) {
  await connection.execute(
    `INSERT INTO brands (name, slug) VALUES (:name, :slug)
     ON DUPLICATE KEY UPDATE name = VALUES(name), active = TRUE`,
    { name: brand, slug: slugify(brand) }
  );
  const [brandRows] = await connection.execute("SELECT id FROM brands WHERE name = :name LIMIT 1", { name: brand });
  const brandId = brandRows[0].id;
  await connection.execute(
    `INSERT INTO vehicle_models (brand_id, name, slug) VALUES (:brandId, :name, :slug)
     ON DUPLICATE KEY UPDATE name = VALUES(name), active = TRUE`,
    { brandId, name: model, slug: slugify(model) }
  );
  const [modelRows] = await connection.execute(
    "SELECT id FROM vehicle_models WHERE brand_id = :brandId AND name = :name LIMIT 1",
    { brandId, name: model }
  );
  return modelRows[0].id;
}

function vehiclePayload(body, file) {
  return {
    brand: body.brand,
    model: body.model,
    version: body.version || null,
    year: Number(body.year),
    type: body.type,
    vehicle_condition: body.condition || "new",
    price: Number(body.price),
    mileage: Number(body.mileage || 0),
    fuel: body.fuel || null,
    transmission: body.transmission || null,
    color: body.color || null,
    description: body.description || null,
    status: body.status || "available",
    image_url: file ? `/uploads/${file.filename}` : body.imageUrl || null,
  };
}

function validateVehicle(data) {
  const required = ["brand", "model", "year", "type", "price"];
  const missing = required.filter((field) => data[field] === undefined || data[field] === null || data[field] === "");
  if (missing.length) return `Faltan campos obligatorios: ${missing.join(", ")}`;
  if (data.year < 1950 || data.year > 2100) return "Año inválido";
  if (data.price < 0) return "Precio inválido";
  return null;
}

async function createVehicle(req, res, next) {
  let connection;
  try {
    connection = await pool.getConnection();
    const data = vehiclePayload(req.body, req.file);
    const error = validateVehicle(data);
    if (error) return res.status(400).json({ message: error });

    await connection.beginTransaction();
    data.model_id = await resolveModelId(connection, data.brand, data.model);
    const [result] = await connection.execute(
      `INSERT INTO vehicles
       (brand, model, model_id, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
       VALUES
       (:brand, :model, :model_id, :version, :year, :type, :vehicle_condition, :price, :mileage, :fuel, :transmission, :color, :description, :status, :image_url)`,
      data
    );
    await connection.commit();
    const [rows] = await connection.execute("SELECT * FROM vehicles WHERE id = :id", { id: result.insertId });
    return res.status(201).json({ vehicle: toVehicle(rows[0]) });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
}

async function updateVehicle(req, res, next) {
  try {
    const [existingRows] = await pool.execute("SELECT * FROM vehicles WHERE id = :id", { id: req.params.id });
    if (!existingRows[0]) return res.status(404).json({ message: "Vehículo no encontrado" });

    const current = existingRows[0];
    const data = vehiclePayload({
      brand: req.body.brand ?? current.brand,
      model: req.body.model ?? current.model,
      version: req.body.version ?? current.version,
      year: req.body.year ?? current.year,
      type: req.body.type ?? current.type,
      condition: req.body.condition ?? current.vehicle_condition,
      price: req.body.price ?? current.price,
      mileage: req.body.mileage ?? current.mileage,
      fuel: req.body.fuel ?? current.fuel,
      transmission: req.body.transmission ?? current.transmission,
      color: req.body.color ?? current.color,
      description: req.body.description ?? current.description,
      status: req.body.status ?? current.status,
      imageUrl: req.body.imageUrl ?? current.image_url,
    }, req.file);

    const error = validateVehicle(data);
    if (error) return res.status(400).json({ message: error });
    data.model_id = await resolveModelId(pool, data.brand, data.model);

    await pool.execute(
      `UPDATE vehicles SET
        brand = :brand,
        model = :model,
        model_id = :model_id,
        version = :version,
        year = :year,
        type = :type,
        vehicle_condition = :vehicle_condition,
        price = :price,
        mileage = :mileage,
        fuel = :fuel,
        transmission = :transmission,
        color = :color,
        description = :description,
        status = :status,
        image_url = :image_url
       WHERE id = :id`,
      { ...data, id: req.params.id }
    );

    const [rows] = await pool.execute("SELECT * FROM vehicles WHERE id = :id", { id: req.params.id });
    return res.json({ vehicle: toVehicle(rows[0]) });
  } catch (error) {
    return next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const [result] = await pool.execute("DELETE FROM vehicles WHERE id = :id", { id: req.params.id });
    if (!result.affectedRows) return res.status(404).json({ message: "Vehículo no encontrado" });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function listAdminVehicles(req, res, next) {
  try {
    const {
      search = "",
      brand,
      type,
      status,
      minPrice,
      maxPrice,
      limit = 100,
      offset = 0,
    } = req.query;

    const where = [];
    const params = {
      search: `%${search}%`,
      limit: Math.min(Number(limit) || 100, 200),
      offset: Number(offset) || 0,
    };

    if (search) {
      where.push(
        "(brand LIKE :search OR model LIKE :search OR version LIKE :search OR description LIKE :search)"
      );
    }

    if (brand) {
      where.push("brand = :brand");
      params.brand = brand;
    }

    if (type) {
      where.push("type = :type");
      params.type = type;
    }

    if (status && status !== "all") {
      where.push("status = :status");
      params.status = status;
    }

    if (minPrice) {
      where.push("price >= :minPrice");
      params.minPrice = Number(minPrice);
    }

    if (maxPrice) {
      where.push("price <= :maxPrice");
      params.maxPrice = Number(maxPrice);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `SELECT * FROM vehicles ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${params.limit} OFFSET ${params.offset}`,
      params
    );

    const { limit: _limit, offset: _offset, ...countParams } = params;
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM vehicles ${whereSql}`,
      countParams
    );

    return res.json({
      total: countRows[0].total,
      vehicles: rows.map(toVehicle),
    });
  } catch (error) {
    return next(error);
  }
}
module.exports = {
  listVehicles,
  listAdminVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
