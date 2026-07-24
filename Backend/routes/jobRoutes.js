import express from 'express';
import JobPosting from '../models/JobPosting.js';
import JobApplication from '../models/JobApplication.js';
import { createCrudHandlers } from '../utils/crudFactory.js';

const jobHandlers = createCrudHandlers(JobPosting, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    return filter;
  },
});

const applicationHandlers = createCrudHandlers(JobApplication, {
  buildFilter: (req) => {
    const filter = {};
    if (req.query.jobId) filter.job = req.query.jobId;
    if (req.query.status) filter.status = req.query.status;
    return filter;
  },
});

export const listApplicationsForJob = async (req, res) => {
  try {
    const applications = await JobApplication.find({ job: req.params.jobId }).sort({ createdAt: -1 });
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

router.get('/', jobHandlers.list);
router.post('/', jobHandlers.create);
router.get('/applications', applicationHandlers.list);
router.put('/applications/:id', applicationHandlers.update);
router.delete('/applications/:id', applicationHandlers.remove);
router.get('/:jobId/applications', listApplicationsForJob);
router.post('/:jobId/applications', applyToJob);
router.get('/:id', jobHandlers.getOne);
router.put('/:id', jobHandlers.update);
router.delete('/:id', jobHandlers.remove);

export default router;
