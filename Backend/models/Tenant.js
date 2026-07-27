import mongoose from 'mongoose';

const TenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  apiKey: {
    type: String,
    unique: true,
    required: true
  },
  plan: {
    type: String,
    enum: ['Free', 'Basic', 'Premium', 'Enterprise'],
    default: 'Free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  limits: {
    maxEmployees: { type: Number, default: 10 },
    maxLeads: { type: Number, default: 50 },
    maxWorkflows: { type: Number, default: 3 }
  },
  billingStatus: {
    type: String,
    enum: ['Active', 'Past Due', 'Unpaid', 'Trialing'],
    default: 'Trialing'
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  activePlugins: {
    type: [String],
    enum: ['Payroll', 'Inventory', 'Helpdesk', 'Assets', 'Training'],
    default: ['Payroll']
  }
}, { timestamps: true });

export default mongoose.model('Tenant', TenantSchema);
