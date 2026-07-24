import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'General', date: new Date().toISOString().split('T')[0] });

  const fetchAnnouncements = async () => {
    const res = await api.get('/announcements');
    setAnnouncements(res.data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/announcements', formData);
    setIsModalOpen(false);
    setFormData({ title: '', description: '', type: 'General', date: new Date().toISOString().split('T')[0] });
    fetchAnnouncements();
  };

  return (
    <PageShell
      title="Announcements"
      description="Company-wide messages and updates"
      count={announcements.length}
      actions={<button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]"><FiPlus className="h-3.5 w-3.5" /> New</button>}
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No announcements.</td></tr>
            ) : announcements.map((a) => (
              <tr key={a._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3"><p className="font-medium text-ink">{a.title}</p><p className="mt-0.5 line-clamp-1 text-muted">{a.description}</p></td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{a.type}</span></td>
                <td className="px-4 py-3 text-muted">{new Date(a.date).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/announcements/${a._id}`); fetchAnnouncements(); } }} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded border border-line bg-surface p-4">
            <h3 className="mb-3 font-semibold text-ink">New announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Title" className="app-input h-9 text-[13px]" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <textarea required placeholder="Description" rows={3} className="app-input text-[13px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <select className="app-input h-9 text-[13px]" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option>General</option><option>Urgent</option><option>Event</option></select>
              <div className="flex justify-end gap-2"><button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary h-9 px-3 text-[13px]">Publish</button></div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AnnouncementsView;
