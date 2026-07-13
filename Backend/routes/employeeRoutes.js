import express from 'express';
import { registerEmployee, loginEmployee, getEmployees, logoutEmployee } from '../controllers/employeeController.js';

const router = express.Router();

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.post('/logout', logoutEmployee);
router.get('/', getEmployees);

export default router;
