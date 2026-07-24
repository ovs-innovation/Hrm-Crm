import Client from '../models/Client.js';
import Employee from '../models/Employee.js';
import Deal from '../models/Deal.js';
import Project from '../models/Project.js';
import Ticket from '../models/Ticket.js';

export const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ clients: [], employees: [], deals: [], projects: [], tickets: [] });
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [clients, employees, deals, projects, tickets] = await Promise.all([
      Client.find({ $or: [{ name: regex }, { company: regex }, { email: regex }] }).limit(8).select('name company email status'),
      Employee.find({ $or: [{ name: regex }, { email: regex }, { employeeId: regex }] }).limit(8).select('name email employeeId department'),
      Deal.find({ $or: [{ title: regex }, { clientName: regex }] }).limit(8).select('title stage amount clientName'),
      Project.find({ $or: [{ name: regex }, { client: regex }] }).limit(6).select('name status'),
      Ticket.find({ $or: [{ subject: regex }, { description: regex }] }).limit(6).select('subject status priority'),
    ]);
    res.json({ clients, employees, deals, projects, tickets, query: q });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
