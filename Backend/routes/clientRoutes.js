import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createClient, getClients, updateClient, deleteClient } from '../controllers/clientController.js';

const router = express.Router();

router.route('/')
  .post(protect, createClient)
  .get(protect, getClients);

router.route('/:id')
  .put(protect, updateClient)
  .delete(protect, deleteClient);

export default router;
