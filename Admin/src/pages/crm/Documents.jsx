import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const Documents = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', fileName: '', fileUrl: '', category: 'General', notes: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/documents', form);
    setModalOpen(false);
    setForm({ title: '', fileName: '', fileUrl: '', category: 'General', notes: '' });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Documents"
      description="CRM files and attachments linked to accounts and deals"
      count={items.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add document
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">File</th>
              <th className="px-4 py-2.5 font-medium">Added</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No documents yet.</td></tr>
            ) : items.map((doc) => (
              <tr key={doc._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{doc.title}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{doc.category}</span></td>
                <td className="px-4 py-3">
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">{doc.fileName || 'View file'}</a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-muted">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(doc._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add document">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Title</label><input required className="app-input h-9 w-full text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">File name</label><input className="app-input h-9 w-full text-[13px]" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Category</label><select className="app-input h-9 w-full text-[13px]" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>General</option><option>Contract</option><option>Proposal</option><option>Invoice</option></select></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">File URL</label><input className="app-input h-9 w-full text-[13px]" placeholder="https://…" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} /></div>
          <div><label className="app-label mb-1 block text-[13px]">Notes</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Documents;
