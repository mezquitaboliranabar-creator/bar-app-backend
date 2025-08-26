const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/musicSearchController");

// Buscar canciones en Spotify (Client Credentials)
router.get("/", ctrl.searchTracks);

// (opcional) ping de prueba
// router.get("/ping", (_req, res) => res.json({ ok: true, src: "musicSearchRoutes" }));

module.exports = router;
