import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    type: { type: String, enum: ['Proposal', 'Quote', 'Invoice'], default: 'Proposal' },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Paid', 'Overdue', 'Cancelled', 'Pending'],
      default: 'Draft',
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    dealTitle: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    projectTitle: { type: String },

    invoiceDate: { type: String },
    dueDate: { type: Date },

    companyName: { type: String },
    companyGst: { type: String },
    companyAddress: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    logoUrl: { type: String },
    signatureUrl: { type: String },
    stampUrl: { type: String },

    customerGst: { type: String },
    billingAddress: { type: String },

    items: [{
      description: { type: String, required: true },
      hsn: { type: String, default: '' },
      quantity: { type: Number, default: 1 },
      rate: { type: Number, default: 0 },
      tax: { type: Number, default: 18 },
      amount: { type: Number, default: 0 },
    }],

    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },

    template: { type: String, default: 'corporate' },
    currency: { type: String, default: '₹' },
    termsAndConditions: { type: String },
    notes: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },

    proposalSections: {
      executiveSummary: { type: String, default: '' },
      scope: { type: String, default: '' },
      timeline: { type: String, default: '' },
      callToAction: { type: String, default: '' },
    },

    owner: { type: String },
  },
  { timestamps: true }
);

tenantScoped(invoiceSchema);
invoiceSchema.index({ tenantId: 1, number: 1 }, { unique: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
