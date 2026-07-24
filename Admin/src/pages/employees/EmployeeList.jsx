import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEye } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageShell from '../../components/PageShell';
import AddEmployeeForm from '../../features/employees/components/AddEmployeeForm';
import CsvImportButton from '../../components/CsvImportButton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.map((emp) => ({ ...emp, id: emp.employeeId || emp._id })));
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((emp) =>
    [emp.id, emp.name, emp.email].some((v) => String(v || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (emp) => {
    if (!window.confirm(`Remove ${emp.name}?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch {
      toast.error('Failed to remove employee');
    }
  };

  return (
    <PageShell
      title="Employees"
      description="Manage staff records and access"
      count={filtered.length}
      actions={
        <div className="flex gap-2">
          <CsvImportButton type="employees" label="Import" onDone={fetchEmployees} />
          <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add employee
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <input
          type="search"
          placeholder="Search by ID, name, or email…"
          className="app-input h-9 max-w-sm text-[13px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Department</th>
              <th className="px-4 py-2.5 font-medium">Designation</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No employees found.</td></tr>
            ) : filtered.map((emp) => (
              <tr key={emp._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 text-muted">{emp.id}</td>
                <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                <td className="px-4 py-3 text-muted">{emp.email}</td>
                <td className="px-4 py-3 text-muted">{emp.department || '—'}</td>
                <td className="px-4 py-3 text-muted">{emp.designation || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setViewEmployee(emp)} className="mr-1 rounded p-1.5 text-muted hover:text-brand"><FiEye className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => handleDelete(emp)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add employee" size="xl">
        <AddEmployeeForm onCancel={() => setIsAddModalOpen(false)} onSuccess={(data) => { setIsAddModalOpen(false); fetchEmployees(); toast.success(data?.inviteSent ? 'Employee added — invite email sent' : 'Employee added'); }} />
      </Modal>

      <Modal isOpen={!!viewEmployee} onClose={() => setViewEmployee(null)} title="Employee details">
        {viewEmployee && (
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <div><dt className="text-muted">Name</dt><dd className="font-medium text-ink">{viewEmployee.name}</dd></div>
            <div><dt className="text-muted">Email</dt><dd className="text-ink">{viewEmployee.email}</dd></div>
            <div><dt className="text-muted">Department</dt><dd className="text-ink">{viewEmployee.department || '—'}</dd></div>
            <div><dt className="text-muted">Branch</dt><dd className="text-ink">{viewEmployee.branch || '—'}</dd></div>
          </dl>
        )}
      </Modal>
    </PageShell>
  );
};

export default EmployeeList;
