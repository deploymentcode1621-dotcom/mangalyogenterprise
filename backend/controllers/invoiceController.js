const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../utils/invoicePDF');

const getAllInvoices = async (req, res) => {
  try {
    const { siteId, status } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    const invoices = await Invoice.find(filter)
      .populate('siteId', 'name address ownerName phone gstNumber')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'siteId',
      'name address ownerName phone gstNumber projectName'
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { items, taxRate = 0, ...rest } = req.body;

    const processedItems = items.map((item) => ({
      ...item,
      amount: item.quantity * item.rate,
    }));

    const subtotal = processedItems.reduce((s, i) => s + i.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = await Invoice.create({
      ...rest,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      createdBy: req.admin._id,
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateInvoice = async (req, res) => {
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

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'siteId',
      'name address ownerName phone gstNumber'
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const doc = generateInvoicePDF(invoice, 'Invoice');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, downloadPDF };
