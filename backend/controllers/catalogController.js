const pool = require("../config/database");

async function listBrands(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.name, b.slug, COUNT(v.id) AS vehicleCount
       FROM brands b
       LEFT JOIN vehicle_models vm ON vm.brand_id = b.id
       LEFT JOIN vehicles v ON v.model_id = vm.id AND v.status = 'available'
       WHERE b.active = TRUE
       GROUP BY b.id, b.name, b.slug
       ORDER BY b.name`
    );
    return res.json({ brands: rows.map((row) => ({ ...row, vehicleCount: Number(row.vehicleCount) })) });
  } catch (error) {
    return next(error);
  }
}

async function listModels(req, res, next) {
  try {
    const params = {};
    let where = "WHERE vm.active = TRUE AND b.active = TRUE";
    if (req.query.brandId) {
      where += " AND b.id = :brandId";
      params.brandId = Number(req.query.brandId);
    }

    const [rows] = await pool.execute(
      `SELECT vm.id, vm.name, vm.slug, vm.brand_id AS brandId, b.name AS brand
       FROM vehicle_models vm
       INNER JOIN brands b ON b.id = vm.brand_id
       ${where}
       ORDER BY b.name, vm.name`,
      params
    );
    return res.json({ models: rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listBrands, listModels };
