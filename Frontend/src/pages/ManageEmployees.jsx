import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import AddEmployeeForm from '../features/employees/components/AddEmployeeForm';
import AICopilotCard from '../components/AICopilotCard';
import api from '../services/api';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // AI Copilot States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleRowClick = async (emp) => {
    setSelectedEmployee(emp);
    setAiLoading(true);
    try {
      const { data } = await api.get(`/ai/employee-card/${emp._id}`);
      setAiData(data);
    } catch (err) {
      toast.error('Failed to retrieve employee AI insights');
      setAiData(null);
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = employees.filter((e) =>
    [e.name, e.email, e.employeeId].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (emp, e) => {
    e.stopPropagation(); // Avoid triggering row selection
    if (!window.confirm(`Remove ${emp.name}?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success('Employee removed');
      if (selectedEmployee?._id === emp._id) {
        setSelectedEmployee(null);
        setAiData(null);
      }
      fetchEmployees();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <PageShell
      title="Employees"
      description="Manage team members"
      count={filtered.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add employee
        </button>
      }
    >
      <input type="search" placeholder="Search…" className="app-input mb-3 h-9 max-w-sm text-[13px]" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 overflow-hidden rounded border border-line bg-surface">
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No employees.</td></tr>
              ) : filtered.map((emp) => (
                <tr 
                  key={emp._id} 
                  className={`border-b border-line last:border-0 hover:bg-soft/60 cursor-pointer ${selectedEmployee?._id === emp._id ? 'bg-brand-xlight/50' : ''}`}
                  onClick={() => handleRowClick(emp)}
                >
                  <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                  <td className="px-4 py-3 text-muted">{emp.email}</td>
                  <td className="px-4 py-3 text-muted">{emp.department || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={(e) => handleDelete(emp, e)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Copilot Panel */}
        <div className="xl:col-span-1 space-y-4">
          {selectedEmployee ? (
            <AICopilotCard 
              title={`AI Employee Coach: ${selectedEmployee.name}`}
              data={aiData} 
              loading={aiLoading} 
            />
          ) : (
            <div className="border border-dashed border-line rounded bg-surface p-8 text-center text-muted text-xs">
              Select an employee from the table to consult the AI Employee Coach.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add employee" size="xl">
        <AddEmployeeForm onCancel={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchEmployees(); toast.success('Employee added'); }} />
      </Modal>
    </PageShell>
  );
};

export default ManageEmployees;
