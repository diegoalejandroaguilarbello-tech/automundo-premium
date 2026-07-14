const express = require("express");
const {
  listFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");

const router = express.Router();

router.get("/", listFavorites);
router.post("/", addFavorite);
router.delete("/", removeFavorite);
router.delete("/:vehiculo_id", removeFavorite);

module.exports = router;
