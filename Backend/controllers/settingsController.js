import CompanySettings from '../models/CompanySettings.js';
import { logAudit } from '../utils/auditLogger.js';

const DEFAULTS = {
  singleton: 'default',
  companyName: 'Vastora Tech',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  country: 'India',
};

export const getCompanySettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ singleton: 'default' });
    if (!settings) {
      settings = await CompanySettings.create(DEFAULTS);
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompanySettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne({ singleton: 'default' });
    if (!settings) {
      settings = await CompanySettings.create({ ...DEFAULTS, ...req.body });
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    await logAudit({ req, action: 'UPDATE', module: 'settings', entityId: settings._id, entityLabel: settings.companyName, changes: req.body });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
