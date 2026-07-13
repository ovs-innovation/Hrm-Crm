import express from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .delete(protect, deleteProject);

export default router;
