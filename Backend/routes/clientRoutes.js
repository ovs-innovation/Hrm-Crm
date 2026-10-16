import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';
import { createClient, getClients, updateClient, deleteClient } from '../controllers/clientController.js';

const router = express.Router();

router.use(protect);
router.route('/')
  .post(requireStaff, createClient)
  .get(getClients);

router.route('/:id')
  .put(requireStaff, updateClient)
  .delete(requireStaff, deleteClient);

export default router;
