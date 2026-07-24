import Invoice from '../models/Invoice.js';
import { logAudit } from '../utils/auditLogger.js';

const calcTotals = (items, taxRate = 18) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  return { subtotal, taxAmount, total: subtotal + taxAmount };
};

const nextNumber = async (type) => {
  const prefix = type === 'Quote' ? 'QT' : 'INV';
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({ type });
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const type = req.body.type || 'Quote';
    const number = req.body.number || (await nextNumber(type));
    const items = (req.body.items || []).map((i) => ({
      ...i,
      amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
    }));
    const taxRate = Number(req.body.taxRate) || 18;
    const totals = calcTotals(items, taxRate);
    const invoice = await Invoice.create({
      ...req.body,
      number,
      type,
      items,
      taxRate,
      ...totals,
      owner: req.user?.name,
    });
    await logAudit({ req, action: 'CREATE', module: 'invoice', entityId: invoice._id, entityLabel: invoice.number });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    if (req.body.items) {
      req.body.items = req.body.items.map((i) => ({
        ...i,
        amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
      }));
      const taxRate = Number(req.body.taxRate ?? invoice.taxRate);
      Object.assign(invoice, req.body, calcTotals(req.body.items, taxRate));
    } else {
      Object.assign(invoice, req.body);
    }
    await invoice.save();
    await logAudit({ req, action: 'UPDATE', module: 'invoice', entityId: invoice._id, entityLabel: invoice.number });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    await invoice.deleteOne();
    await logAudit({ req, action: 'DELETE', module: 'invoice', entityId: req.params.id, entityLabel: invoice.number });
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const convertQuoteToInvoice = async (req, res) => {
  try {
    const quote = await Invoice.findById(req.params.id);
    if (!quote || quote.type !== 'Quote') {
      return res.status(400).json({ message: 'Quote not found' });
    }
    const number = await nextNumber('Invoice');
    const invoice = await Invoice.create({
      ...quote.toObject(),
      _id: undefined,
      number,
      type: 'Invoice',
      status: 'Sent',
      createdAt: undefined,
      updatedAt: undefined,
    });
    quote.status = 'Accepted';
    await quote.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
