import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const emptyForm = () => ({ title: '', description: '', type: 'General', date: indiaToday() });

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load announcements.');
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/announcements', formData);
      toast.success(data.emailNotice || 'Published. Employees can see it on their dashboard.');
      setIsModalOpen(false);
      setFormData(emptyForm());
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not publish the announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Announcements"
      description="Publish a message. Employees see it on the dashboard and the Announcements page."
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
                  <button type="button" onClick={async () => { if (window.confirm('Delete?')) { try { await api.delete(`/announcements/${a._id}`); fetchAnnouncements(); } catch (err) { toast.error(err.response?.data?.message || 'Could not delete the announcement.'); } } }} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
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
              <div className="flex justify-end gap-2"><button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-primary h-9 px-3 text-[13px]">{saving ? 'Publishing…' : 'Publish'}</button></div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AnnouncementsView;
