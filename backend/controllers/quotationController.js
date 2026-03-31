const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../utils/invoicePDF');

const getAllQuotations = async (req, res) => {
  try {
    const { siteId, status } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    const quotations = await Quotation.find(filter)
      .populate('siteId', 'name address ownerName phone gstNumber')
      .sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      'siteId',
      'name address ownerName phone gstNumber projectName'
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createQuotation = async (req, res) => {
  try {
    const { items, taxRate = 0, ...rest } = req.body;

    const processedItems = items.map((item) => ({
      ...item,
      amount: item.quantity * item.rate,
    }));

    const subtotal = processedItems.reduce((s, i) => s + i.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const quotation = await Quotation.create({
      ...rest,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      createdBy: req.admin._id,
    });

    res.status(201).json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateQuotation = async (req, res) => {
  try {
    const { items, taxRate, ...rest } = req.body;
    let updateData = { ...rest };

    if (items) {
      const processedItems = items.map((item) => ({
        ...item,
        amount: item.quantity * item.rate,
      }));
      const subtotal = processedItems.reduce((s, i) => s + i.amount, 0);
      const tr = taxRate !== undefined ? taxRate : 0;
      const taxAmount = (subtotal * tr) / 100;
      updateData = { ...updateData, items: processedItems, subtotal, taxRate: tr, taxAmount, total: subtotal + taxAmount };
    }

    const quotation = await Quotation.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status === 'converted') {
      return res.status(400).json({ message: 'Already converted to invoice' });
    }

    const invoice = await Invoice.create({
      siteId: quotation.siteId,
      items: quotation.items,
      subtotal: quotation.subtotal,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      total: quotation.total,
      notes: quotation.notes,
      createdBy: req.admin._id,
    });

    quotation.status = 'converted';
    quotation.convertedInvoiceId = invoice._id;
    await quotation.save();

    res.status(201).json({ invoice, quotation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      'siteId',
      'name address ownerName phone gstNumber'
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const doc = generateInvoicePDF(quotation, 'Quotation');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${quotation.quotationNumber}.pdf`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertToInvoice,
  downloadPDF,
};
