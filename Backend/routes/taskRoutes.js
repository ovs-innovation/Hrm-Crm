import express from 'express';
import { createTask, getTasks, updateTaskStatus, deleteTask } from '../controllers/taskController.js';

const router = express.Router();

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .put(updateTaskStatus)
  .delete(deleteTask);

export default router;
