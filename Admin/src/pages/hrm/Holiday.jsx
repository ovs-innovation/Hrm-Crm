import React, { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageShell from '../../components/PageShell';
import AddHolidayForm from '../../features/holiday/components/AddHolidayForm';
import api from '../../services/api';

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/holidays');
      setHolidays(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  const handleAddHoliday = async (newHoliday) => {
    await api.post('/holidays', newHoliday);
    setIsAddModalOpen(false);
    fetchHolidays();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this holiday?')) return;
    await api.delete(`/holidays/${id}`);
    fetchHolidays();
  };

  return (
    <PageShell
      title="Holidays"
      description="Company-wide public and optional holidays"
      count={holidays.length}
      actions={
        <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add holiday
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[13px] text-muted">
          <FiCalendar className="h-4 w-4" /> Holiday calendar
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Day</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : holidays.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No holidays configured.</td></tr>
            ) : holidays.map((h) => (
              <tr key={h.id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{h.name}</td>
                <td className="px-4 py-3 text-ink">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-muted">{h.day}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{h.type}</span></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(h.id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add holiday">
        <AddHolidayForm onSubmit={handleAddHoliday} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>
    </PageShell>
  );
};

export default Holiday;
