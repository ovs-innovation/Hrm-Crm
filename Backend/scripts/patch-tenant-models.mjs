import fs from 'fs';
import path from 'path';

const dir = path.resolve('models');
const skip = new Set([
  'Admin.js',
  'Employee.js',
  'Client.js',
  'Tenant.js',
  'RefreshToken.js',
]);

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  if (skip.has(file)) continue;
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes('tenantScoped')) {
    console.log('skip already', file);
    continue;
  }
  if (!src.includes("from 'mongoose'")) {
    console.log('skip', file);
    continue;
  }

  if (!src.includes("tenantScope.plugin.js")) {
    src = src.replace(
      "import mongoose from 'mongoose';",
      "import mongoose from 'mongoose';\nimport { tenantScoped } from '../plugins/tenantScope.plugin.js';"
    );
  }

  const schemaMatch = src.match(/const (\w+[Ss]chema) = /);
  if (schemaMatch) {
    const sn = schemaMatch[1];
    if (!src.includes(`tenantScoped(${sn})`)) {
      if (src.includes('mongoose.model')) {
        src = src.replace(/(const \w+ = mongoose\.model)/, `tenantScoped(${sn});\n\n$1`);
        src = src.replace(/(export default mongoose\.model)/, `tenantScoped(${sn});\n\n$1`);
      }
    }
  }

  if (file === 'Invoice.js') {
    src = src.replace(
      'number: { type: String, required: true, unique: true }',
      'number: { type: String, required: true }'
    );
    if (!src.includes('tenantId: 1, number')) {
      src = src.replace(
        'tenantScoped(invoiceSchema);',
        "tenantScoped(invoiceSchema);\ninvoiceSchema.index({ tenantId: 1, number: 1 }, { unique: true });"
      );
    }
  }

  if (file === 'Department.js') {
    src = src.replace('unique: true, trim: true', 'trim: true');
    if (!src.includes('tenantId: 1, name')) {
      src = src.replace(
        /tenantScoped\((\w+)\);/,
        'tenantScoped($1);\n$1.index({ tenantId: 1, name: 1 }, { unique: true });'
      );
    }
  }

  if (file === 'Project.js') {
    src = src.replace(/unique:\s*true/, '/* per-tenant via compound index */');
  }

  if (file === 'CompanySettings.js') {
    src = src.replace(
      "singleton: { type: String, default: 'default', unique: true }",
      "singleton: { type: String, default: 'default' }"
    );
    if (!src.includes('tenantId: 1, singleton')) {
      src = src.replace(
        /tenantScoped\((\w+)\);/,
        'tenantScoped($1);\n$1.index({ tenantId: 1, singleton: 1 }, { unique: true });'
      );
    }
  }

  if (file === 'Attendance.js') {
    src = src.replace(
      'attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });',
      'attendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });'
    );
  }
  if (file === 'DailyReport.js') {
    src = src.replace(
      'dailyReportSchema.index({ employeeId: 1, date: 1 }, { unique: true });',
      'dailyReportSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });'
    );
  }
  if (file === 'Payslip.js') {
    src = src.replace(
      'payslipSchema.index({ employeeId: 1, month: 1 }, { unique: true });',
      'payslipSchema.index({ tenantId: 1, employeeId: 1, month: 1 }, { unique: true });'
    );
  }
  if (file === 'ShiftRoster.js') {
    src = src.replace(
      'shiftRosterSchema.index({ employeeId: 1, date: 1 }, { unique: true });',
      'shiftRosterSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });'
    );
  }

  // Models that already declare tenantId field still get the plugin
  fs.writeFileSync(p, src);
  console.log('patched', file);
}
