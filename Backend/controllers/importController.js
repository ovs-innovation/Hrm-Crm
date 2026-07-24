import Client from '../models/Client.js';
import Employee from '../models/Employee.js';
import InviteToken from '../models/InviteToken.js';
import { logAudit } from '../utils/auditLogger.js';

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i] || ''; });
    return row;
  });
};

export const importLeads = async (req, res) => {
  try {
    const rows = parseCsv(req.body.csv || '');
    if (!rows.length) {
      return res.status(400).json({ message: 'No valid CSV rows found' });
    }
    const created = [];
    const errors = [];
    for (const row of rows) {
      try {
        const name = row.name || row.contact || '';
        const company = row.company || row.organization || 'Unknown';
        const email = (row.email || '').toLowerCase();
        if (!name && !email) {
          errors.push({ row, error: 'Name or email required' });
          continue;
        }
        const doc = await Client.create({
          name: name || email.split('@')[0],
          company,
          email,
          phone: row.phone || row.mobile || '',
          status: row.status || 'Lead',
          source: row.source || 'Import',
          owner: req.user?.name || row.owner || '',
        });
        created.push(doc);
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }
    await logAudit({ req, action: 'IMPORT', module: 'leads', entityLabel: `${created.length} leads`, changes: { count: created.length } });
    res.json({ created: created.length, errors, items: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importEmployees = async (req, res) => {
  try {
    const rows = parseCsv(req.body.csv || '');
    if (!rows.length) {
      return res.status(400).json({ message: 'No valid CSV rows found' });
    }
    const created = [];
    const errors = [];
    for (const row of rows) {
      try {
        const email = (row.email || '').toLowerCase();
        const employeeId = row.employeeid || row.employee_id || row.id || `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (!email || !row.name) {
          errors.push({ row, error: 'Name and email required' });
          continue;
        }
        const exists = await Employee.findOne({ $or: [{ email }, { employeeId }] });
        if (exists) {
          errors.push({ row, error: 'Duplicate email or ID' });
          continue;
        }
        const doc = await Employee.create({
          employeeId,
          name: row.name,
          email,
          password: row.password || 'Password123',
          department: row.department || '',
          designation: row.designation || '',
          branch: row.branch || '',
          role: row.role || 'Employee',
          joinDate: row.joindate || row.join_date || new Date(),
        });
        created.push({ _id: doc._id, name: doc.name, email: doc.email, employeeId: doc.employeeId });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }
    await logAudit({ req, action: 'IMPORT', module: 'employees', entityLabel: `${created.length} employees`, changes: { count: created.length } });
    res.json({ created: created.length, errors, items: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getImportTemplate = (req, res) => {
  const type = req.params.type;
  if (type === 'leads') {
    return res.type('text/csv').send('name,company,email,phone,status,source,owner\nJohn Doe,Acme Corp,john@acme.com,9876543210,Lead,Website,Sales Team');
  }
  if (type === 'employees') {
    return res.type('text/csv').send('name,email,employeeId,department,designation,branch,role,joinDate\nJane Smith,jane@vastora.com,EMP001,Engineering,Developer,HQ,Employee,2024-01-15');
  }
  res.status(400).json({ message: 'Unknown template type' });
};
