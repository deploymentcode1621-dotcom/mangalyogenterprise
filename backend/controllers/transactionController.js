const Transaction = require('../models/Transaction');
const Site = require('../models/Site');
const { exportTransactionsToExcel } = require('../utils/excelExport');
const { validationResult } = require('express-validator');

const getAllTransactions = async (req, res) => {
  try {
    const { siteId, type, paymentMode, startDate, endDate } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (type) filter.type = type;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('siteId', 'name address')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id).populate('siteId', 'name address');
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const txn = await Transaction.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json(txn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findByIdAndDelete(req.params.id);
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { siteId } = req.query;
    const filter = siteId ? { siteId } : {};
    const transactions = await Transaction.find(filter)
      .populate('siteId', 'name')
      .sort({ date: -1 });

    let siteName = 'All Sites';
    if (siteId) {
      const site = await Site.findById(siteId);
      if (site) siteName = site.name;
    }

    const workbook = await exportTransactionsToExcel(transactions, siteName);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=transactions-${siteName.replace(/\s+/g, '_')}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('siteId', 'name');
    const totalIn = transactions.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
    const recent = transactions.slice(0, 10);
    res.json({ totalIn, totalOut, balance: totalIn - totalOut, recentTransactions: recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportToExcel,
  getDashboardSummary,
};
