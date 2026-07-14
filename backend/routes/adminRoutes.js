const express = require("express");
const {
  listAdminVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const { authenticate, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
  "/vehicles",
  authenticate,
  authorize("admin", "sales"),
  listAdminVehicles
);

router.post(
  "/vehicles",
  authenticate,
  authorize("admin", "sales"),
  upload.single("image"),
  createVehicle
);

router.put(
  "/vehicles/:id",
  authenticate,
  authorize("admin", "sales"),
  upload.single("image"),
  updateVehicle
);

router.delete(
  "/vehicles/:id",
  authenticate,
  authorize("admin"),
  deleteVehicle
);

module.exports = router;
