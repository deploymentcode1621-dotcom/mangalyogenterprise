const Site = require('../models/Site');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

const getAllSites = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const sites = await Site.find(filter).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSiteDashboard = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });

    const transactions = await Transaction.find({ siteId: req.params.id }).sort({ date: -1 });

    const totalIn = transactions
      .filter((t) => t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      site,
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      recentTransactions: transactions.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createSite = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const site = await Site.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllSites, getSiteById, getSiteDashboard, createSite, updateSite, deleteSite };
