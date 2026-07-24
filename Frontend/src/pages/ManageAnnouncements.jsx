import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiTrash2, FiMessageCircle, FiX } from 'react-icons/fi';
import { Card, Button } from '../components';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'General',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', formData);
      fetchAnnouncements();
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'General',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Urgent': return 'bg-rose-50 text-brand border-rose-200';
      case 'Event': return 'bg-brand/10 text-brand border-brand/25 border-brand/20';
      default: return 'bg-brand/10 text-brand border-brand/25 text-brand';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Announcements</h1>
          <p className="text-muted text-sm mt-1">Manage and broadcast company-wide messages</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-brand/15 hover:shadow-blue-500/40 transition-all">
          <FiPlus /> New Announcement
        </Button>
      </div>

      <Card className="border border-line shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-surface/50 text-muted text-muted border-b border-line">
                <th className="py-4 px-6 font-semibold">Title</th>
                <th className="py-4 px-6 font-semibold">Type</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {announcements.map((announcement) => (
                <tr key={announcement._id} className="hover:bg-white hover:bg-surface/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted">
                        <FiMessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white/90">{announcement.title}</p>
                        <p className="text-xs text-muted max-w-xs truncate">{announcement.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted text-muted">
                    {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="p-2 text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-muted">No announcements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-line"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-semibold text-ink">Broadcast Announcement</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Title</label>
                  <input
                    type="text" required
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Description</label>
                  <textarea
                    required rows="3"
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line rounded-lg text-white resize-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink text-muted mb-1">Type</label>
                    <select
                      value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-line rounded-lg text-white"
                    >
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink text-muted mb-1">Date</label>
                    <input
                      type="date" required
                      value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-2.5 bg-surface border border-line rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted hover:text-ink font-medium">Cancel</button>
                  <Button type="submit" className="px-6 py-2 rounded-xl">Broadcast</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsView;
