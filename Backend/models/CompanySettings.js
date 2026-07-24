import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'default', unique: true },
    companyName: { type: String, default: 'Vastora Tech' },
    legalName: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String, default: 'India' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    fiscalYearStart: { type: String, default: '04-01' },
    taxId: { type: String },
    logoUrl: { type: String },
    leavePolicy: {
      annualQuota: { type: Number, default: 18 },
      carryForward: { type: Boolean, default: true },
    },
    attendancePolicy: {
      workStart: { type: String, default: '09:00' },
      workEnd: { type: String, default: '18:00' },
      graceMinutes: { type: Number, default: 15 },
    },
    crmSettings: {
      defaultDealStage: { type: String, default: 'Qualification' },
      autoAssignLeads: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
export default CompanySettings;
