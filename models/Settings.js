// models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    preferredDeviceId: { type: String, default: null },
    preferredDeviceName: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
