const mongoose = require('mongoose');
const { SITE_STATUS } = require('../constants/enums');

const siteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    ownerName: { type: String, trim: true },
    phone: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    projectName: { type: String, trim: true },
    status: { type: String, enum: Object.values(SITE_STATUS), default: SITE_STATUS.ACTIVE },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Site', siteSchema);
