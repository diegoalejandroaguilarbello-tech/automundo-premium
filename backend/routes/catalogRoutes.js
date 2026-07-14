const express = require("express");
const { listBrands, listModels } = require("../controllers/catalogController");

const router = express.Router();
router.get("/brands", listBrands);
router.get("/models", listModels);

module.exports = router;
