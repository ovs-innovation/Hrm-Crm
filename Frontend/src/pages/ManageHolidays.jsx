import React, { useState } from 'react';
import { FiPlus, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { Card, Button } from '../components';
import Modal from '../components/Modal';
import AddHolidayForm from '../features/holiday/components/AddHolidayForm';

import api from '../services/api';

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.get('/holidays');
        setHolidays(res.data);
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (newHoliday) => {
    try {
      const res = await api.post('/holidays', newHoliday);
      const updated = [...holidays, res.data].sort((a, b) => new Date(a.date) - new Date(b.date));
      setHolidays(updated);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding holiday', error);
      alert('Failed to add holiday');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/holidays/${id}`);
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting holiday', error);
      alert('Failed to delete holiday');
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Holiday Management</h2>
          <p className="text-muted text-muted text-sm">Manage company-wide public and optional holidays.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
          <FiPlus className="mr-2" /> Add Holiday
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-line bg-surface/50">
          <div className="flex items-center text-muted text-muted font-medium">
            <FiCalendar className="mr-2" /> 2026 Holiday Calendar
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 text-muted text-muted text-sm uppercase tracking-wider border-b border-line">
                <th className="p-4 font-semibold whitespace-nowrap">Holiday Name</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-4 font-semibold whitespace-nowrap">Day</th>
                <th className="p-4 font-semibold whitespace-nowrap">Type</th>
                <th className="p-4 font-semibold whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {holidays.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-white hover:bg-surface/50 transition-colors">
                  <td className="p-4 font-medium text-ink">{holiday.name}</td>
                  <td className="p-4 text-muted text-muted">{formatDate(holiday.date)}</td>
                  <td className="p-4 text-muted text-muted">{holiday.day}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${holiday.type === 'Public' ? 'bg-brand/10 text-brand border-brand/25' :
                        holiday.type === 'Company' ? 'bg-brand/10 text-blue-800 border-brand/25 bg-brand/10 text-brand' :
                          'bg-brand/10 text-brand border-brand/25 bg-brand/10'
                      }`}
                    >
                      {holiday.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="p-2 text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-colors focus:outline-none"
                      title="Remove Holiday"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">
                    Loading holidays...
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">
                    No holidays configured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Holiday"
        size="sm"
      >
        <AddHolidayForm
          onCancel={() => setIsAddModalOpen(false)}
          onSuccess={handleAddHoliday}
        />
      </Modal>
    </div>
  );
};

export default Holiday;
