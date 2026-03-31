const mongoose = require('mongoose');
const { QUOTATION_STATUS } = require('../constants/enums');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true },
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    items: [itemSchema],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: Object.values(QUOTATION_STATUS), default: QUOTATION_STATUS.DRAFT },
    validUntil: { type: Date },
    notes: { type: String },
    date: { type: Date, default: Date.now },
    convertedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await this.constructor.countDocuments();
    this.quotationNumber = `QUO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
