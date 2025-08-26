const express = require('express');
const router = express.Router();
const { getAccessToken } = require('../services/spotifyTokenStore');
const ctrl = require('../controllers/spotifyPlaybackController');


function requireAccessToken(req, res, next) {
if (!getAccessToken()) return res.status(401).json({ ok: false, msg: 'Inicia sesión con Spotify primero' });
next();
}


router.get('/devices', requireAccessToken, ctrl.listDevices);
router.put('/select-device', requireAccessToken, ctrl.selectDevice);
router.put('/play', requireAccessToken, ctrl.play);
router.put('/pause', requireAccessToken, ctrl.pause);
router.post('/next', requireAccessToken, ctrl.nextTrack);
router.post('/previous', requireAccessToken, ctrl.previousTrack);
router.put('/volume', requireAccessToken, ctrl.setVolume);
router.post('/queue', requireAccessToken, ctrl.addToQueue);
router.get('/status', requireAccessToken, ctrl.status);
router.get('/queue', requireAccessToken, ctrl.getQueue);


module.exports = router;