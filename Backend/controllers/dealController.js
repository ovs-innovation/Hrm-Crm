import Deal from '../models/Deal.js';
import { logActivity } from '../utils/activityLogger.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from '../utils/notify.js';
import { sendEmail, dealStageEmailHtml } from '../utils/emailService.js';
import Admin from '../models/Admin.js';

export const createDeal = async (req, res) => {
  try {
    const deal = await Deal.create({ ...req.body, owner: req.body.owner || req.user?.name });
    await logActivity({
      entityType: 'Deal',
      entityId: deal._id,
      entityLabel: deal.title,
      type: 'created',
      title: 'Deal created',
      body: `Amount: ${deal.amount}, Stage: ${deal.stage}`,
      req,
    });
    await logAudit({ req, action: 'CREATE', module: 'deal', entityId: deal._id, entityLabel: deal.title });
    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDeals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.stage) filter.stage = req.query.stage;
    const deals = await Deal.find(filter).populate('client', 'name company email').sort({ updatedAt: -1 });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    const prevStage = deal.stage;
    Object.assign(deal, req.body);
    await deal.save();

    if (req.body.stage && req.body.stage !== prevStage) {
      await logActivity({
        entityType: 'Deal',
        entityId: deal._id,
        entityLabel: deal.title,
        type: 'stage_change',
        title: `Stage: ${prevStage} → ${deal.stage}`,
        metadata: { from: prevStage, to: deal.stage },
        req,
      });
      const admins = await Admin.find({}).select('_id email name');
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          userType: 'Admin',
          title: 'Deal stage updated',
          message: `${deal.title} moved to ${deal.stage}`,
          link: '/deals',
          module: 'crm',
        });
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `Deal updated: ${deal.title}`,
            html: dealStageEmailHtml(deal.title, deal.stage, deal.owner),
          });
        }
      }
    }

    await logAudit({ req, action: 'UPDATE', module: 'deal', entityId: deal._id, entityLabel: deal.title, changes: req.body });
    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    await deal.deleteOne();
    res.json({ message: 'Deal removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
