import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Quote', 'Invoice'], default: 'Quote' },
    status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Paid', 'Overdue', 'Cancelled'], default: 'Draft' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    dealTitle: { type: String },
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    }],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    dueDate: { type: Date },
    notes: { type: String },
    owner: { type: String },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
