import express from 'express';
import JobPosting from '../models/JobPosting.js';
import JobApplication from '../models/JobApplication.js';
import { createCrudHandlers, sanitizeQueryValue } from '../utils/crudFactory.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import { evaluateApplication } from '../controllers/recruitmentController.js';

const jobHandlers = createCrudHandlers(JobPosting, {
  buildFilter: (req) => {
    const filter = {};
    const status = sanitizeQueryValue(req.query.status);
    const department = sanitizeQueryValue(req.query.department);
    if (status) filter.status = status;
    if (department) filter.department = department;
    return filter;
  },
});

const applicationHandlers = createCrudHandlers(JobApplication, {
  buildFilter: (req) => {
    const filter = {};
    const jobId = sanitizeQueryValue(req.query.jobId);
    const status = sanitizeQueryValue(req.query.status);
    if (jobId) filter.job = jobId;
    if (status) filter.status = status;
    return filter;
  },
});

export const listApplicationsForJob = async (req, res) => {
  try {
    const applications = await JobApplication.find({ job: req.params.jobId }).sort({ createdAt: -1 }).limit(500);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyToJob = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'Open') return res.status(400).json({ message: 'Job is not accepting applications' });

    const application = await JobApplication.create({ ...req.body, job: job._id });
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const router = express.Router();

router.use(protect);
router.get('/', jobHandlers.list);
router.post('/', requireAdmin, jobHandlers.create);
router.get('/applications', requireAdmin, applicationHandlers.list);
router.put('/applications/:id', requireAdmin, applicationHandlers.update);
router.delete('/applications/:id', requireAdmin, applicationHandlers.remove);
router.post('/applications/:id/evaluate', requireAdmin, evaluateApplication);
router.get('/:jobId/applications', requireAdmin, listApplicationsForJob);
router.post('/:jobId/applications', applyToJob);
router.get('/:id', jobHandlers.getOne);
router.put('/:id', requireAdmin, jobHandlers.update);
router.delete('/:id', requireAdmin, jobHandlers.remove);

export default router;
