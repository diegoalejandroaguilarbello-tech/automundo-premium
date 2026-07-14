const express = require("express");
const { createQuote, listQuotes } = require("../controllers/quoteController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createQuote);
router.get("/", authenticate, authorize("admin", "sales"), listQuotes);

module.exports = router;
