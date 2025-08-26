// controllers/settingsController.js
const Settings = require('../models/Settings');

exports.getSettings = async (_req, res) => {
  const s = await Settings.findOne({});
  res.json({ ok: true, settings: s || {} });
};

exports.setPreferredDevice = async (req, res) => {
  const { deviceId, deviceName } = req.body || {};
  if (!deviceId) return res.status(400).json({ ok:false, msg:'deviceId es requerido' });

  const s = await Settings.findOneAndUpdate(
    {},
    { preferredDeviceId: deviceId, preferredDeviceName: deviceName || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ ok: true, settings: s });
};
