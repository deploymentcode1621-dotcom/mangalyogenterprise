const mongoose = require('mongoose');
const { TRANSACTION_TYPE, PAYMENT_MODE } = require('../constants/enums');

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(TRANSACTION_TYPE), required: true },
    amount: { type: Number, required: true, min: 0 },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    note: { type: String, trim: true },
    paymentMode: {
      type: String,
      enum: Object.values(PAYMENT_MODE),
      default: PAYMENT_MODE.CASH,
    },
    date: { type: Date, required: true, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
