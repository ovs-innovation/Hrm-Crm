import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', status: 'Active', notes: '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/clients');
        setContacts(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const res = await api.get('/clients');
    setContacts(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      setFormData({ name: '', company: '', email: '', phone: '', status: 'Active', notes: '' });
      refresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await api.delete(`/clients/${id}`);
    refresh();
  };

  return (
    <PageShell
      title="Contacts"
      description="People linked to your accounts and leads"
      count={contacts.length}
      actions={
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add contact
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Account</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No contacts yet.</td></tr>
            ) : contacts.map((c) => (
              <tr key={c._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-ink">{c.company}</td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 text-muted">{c.phone || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{c.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(c._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New contact</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Name</label><input required className="app-input h-9 text-[13px]" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Account</label><input required className="app-input h-9 text-[13px]" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Email</label><input required type="email" className="app-input h-9 text-[13px]" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Phone</label><input className="app-input h-9 text-[13px]" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Contacts;
