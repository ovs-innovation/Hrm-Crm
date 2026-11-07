import Invoice from '../models/Invoice.js';
import { logAudit } from '../utils/auditLogger.js';

const normalizeItems = (items = []) =>
  items.map((i) => {
    const quantity = Number(i.quantity ?? i.qty) || 0;
    const rate = Number(i.rate ?? i.price) || 0;
    const tax = Number(i.tax) || 18;
    const description = i.description || i.item || '';
    return {
      description,
      hsn: i.hsn || '',
      quantity,
      rate,
      tax,
      amount: quantity * rate,
    };
  }).filter((i) => i.description);

const calcTotals = (items, advancePaid = 0) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  // Per-line GST when tax % varies; fallback to 18% split as CGST/SGST
  let taxAmount = 0;
  items.forEach((i) => {
    const line = Number(i.amount) || 0;
    const rate = Number(i.tax) || 18;
    taxAmount += line * (rate / 100);
  });
  taxAmount = Math.round(taxAmount * 100) / 100;
  const cgst = Math.round((taxAmount / 2) * 100) / 100;
  const sgst = Math.round((taxAmount - cgst) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const advance = Number(advancePaid) || 0;
  const pendingAmount = Math.round((total - advance) * 100) / 100;
  const avgTax = subtotal > 0 ? Math.round((taxAmount / subtotal) * 10000) / 100 : 18;
  return { subtotal, taxAmount, cgst, sgst, total, advancePaid: advance, pendingAmount, taxRate: avgTax };
};

const nextNumber = async (type) => {
  const prefix = type === 'Invoice' ? 'INV' : type === 'Quote' ? 'QT' : 'PROP';
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({ type });
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

const isConvertible = (type) => type === 'Proposal' || type === 'Quote';

const cleanRefs = (body = {}) => {
  const next = { ...body };
  ['client', 'deal', 'project'].forEach((key) => {
    if (next[key] === '' || next[key] === null || next[key] === undefined) delete next[key];
  });
  delete next._id;
  delete next.__v;
  delete next.createdAt;
  delete next.updatedAt;
  return next;
};

export const getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) {
      if (req.query.type === 'Proposal') {
        filter.type = { $in: ['Proposal', 'Quote'] };
      } else {
        filter.type = req.query.type;
      }
    }
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
    const body = cleanRefs(req.body);
    const type = body.type || 'Proposal';
    const number = body.number || (await nextNumber(type));
    const items = normalizeItems(body.items || []);
    const totals = calcTotals(items, body.advancePaid);
    const invoice = await Invoice.create({
      ...body,
      number,
      type,
      items,
      ...totals,
      owner: req.user?.name || body.owner,
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

    const body = cleanRefs(req.body);
    delete body.tenantId;
    delete body.number; // number is immutable after create

    if (body.items) {
      body.items = normalizeItems(body.items);
      const totals = calcTotals(body.items, body.advancePaid ?? invoice.advancePaid);
      Object.assign(invoice, body, totals);
    } else if (body.advancePaid != null) {
      Object.assign(invoice, body);
      Object.assign(invoice, calcTotals(invoice.items, body.advancePaid));
    } else {
      Object.assign(invoice, body);
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
    const source = await Invoice.findById(req.params.id);
    if (!source || !isConvertible(source.type)) {
      return res.status(400).json({ message: 'Proposal or quote not found' });
    }
    const number = await nextNumber('Invoice');
    const raw = cleanRefs(source.toObject());

    const invoice = await Invoice.create({
      ...raw,
      number,
      type: 'Invoice',
      status: 'Sent',
      template: 'gst',
      invoiceDate: new Date().toISOString().slice(0, 10),
    });
    source.status = 'Accepted';
    await source.save();
    await logAudit({ req, action: 'CONVERT', module: 'invoice', entityId: invoice._id, entityLabel: invoice.number });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
