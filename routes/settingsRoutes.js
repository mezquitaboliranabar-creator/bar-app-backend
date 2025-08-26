// routes/settingsRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/settingsController');

router.get('/', ctrl.getSettings);
router.put('/device', ctrl.setPreferredDevice);

module.exports = router;
