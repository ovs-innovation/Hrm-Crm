import React, { useState } from 'react';
import { FiPlus, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { Card, Button } from '../../components';
import Modal from '../../components/Modal';
import AddHolidayForm from '../../features/holiday/components/AddHolidayForm';

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/holidays';

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await axios.get(API_URL);
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
      const res = await axios.post(API_URL, newHoliday);
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
      await axios.delete(`${API_URL}/${id}`);
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Holiday Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage company-wide public and optional holidays.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
          <FiPlus className="mr-2" /> Add Holiday
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
            <FiCalendar className="mr-2" /> 2026 Holiday Calendar
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-semibold whitespace-nowrap">Holiday Name</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-4 font-semibold whitespace-nowrap">Day</th>
                <th className="p-4 font-semibold whitespace-nowrap">Type</th>
                <th className="p-4 font-semibold whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {holidays.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{holiday.name}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{formatDate(holiday.date)}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{holiday.day}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${holiday.type === 'Public' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                        holiday.type === 'Company' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' :
                          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                      }`}
                    >
                      {holiday.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none"
                      title="Remove Holiday"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Loading holidays...
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
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
