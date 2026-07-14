const express = require("express");
const { createLead, listLeads, updateLeadStatus } = require("../controllers/leadController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createLead);
router.get("/", authenticate, authorize("admin", "sales"), listLeads);
router.patch("/:id/status", authenticate, authorize("admin", "sales"), updateLeadStatus);

module.exports = router;
