const express = require("express");
const {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.post("/", authenticate, authorize("admin", "sales"), upload.single("image"), createVehicle);
router.put("/:id", authenticate, authorize("admin", "sales"), upload.single("image"), updateVehicle);
router.delete("/:id", authenticate, authorize("admin"), deleteVehicle);

module.exports = router;
