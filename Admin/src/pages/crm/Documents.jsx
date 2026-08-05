import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiCpu } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import AICopilotCard from '../../components/AICopilotCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Documents = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', fileName: '', fileUrl: '', category: 'General', notes: '' });

  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected document and copilot analysis states
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    setAiLoading(true);
    try {
      const { data } = await api.post(`/documents/${doc._id}/evaluate`);
      if (data.success) {
        setAiData(data.data);
      } else {
        setAiData(null);
      }
    } catch (err) {
      console.error(err);
      setAiData(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Saving document and parsing OCR content...');
    try {
      await api.post('/documents', form);
      toast.success('Document uploaded successfully', { id: toastId });
      setModalOpen(false);
      setForm({ title: '', fileName: '', fileUrl: '', category: 'General', notes: '' });
      fetchItems();
    } catch (err) {
      toast.error('Failed to save document', { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    if (selectedDoc?._id === id) setSelectedDoc(null);
    fetchItems();
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }
    const toastId = toast.loading('Running vector semantic search query...');
    try {
      const { data } = await api.post('/ai/kb/query', { query: searchQuery });
      toast.success('Search complete', { id: toastId });
      // Filter list based on search relevance results if any
      if (data.results) {
        const matches = items.filter(item => 
          data.results.some(r => r.metadata?.title === item.title || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setItems(matches);
      }
    } catch (err) {
      toast.error('Semantic search failed, falling back to local filter', { id: toastId });
      const matches = items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setItems(matches);
    }
  };

  return (
    <PageShell
      title="Documents"
      description="CRM files and attachments linked to accounts and deals"
      count={items.length}
      actions={
        <div className="flex gap-2">
          <form onSubmit={handleSemanticSearch} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Semantic search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="app-input h-8 pl-8 pr-3 text-[12px] w-48 focus:w-64 transition-all"
            />
            <FiSearch className="absolute left-2.5 text-muted h-3.5 w-3.5" />
          </form>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add document
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Document list table */}
        <div className={`${selectedDoc ? 'lg:col-span-2' : 'lg:col-span-3'} overflow-hidden rounded border border-line bg-surface transition-all duration-300`}>
          <table className="w-full min-w-[600px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Added</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted animate-pulse">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No documents yet.</td></tr>
              ) : items.map((doc) => (
                <tr 
                  key={doc._id} 
                  onClick={() => handleSelectDoc(doc)}
                  className={`border-b border-line last:border-0 cursor-pointer hover:bg-soft/60 ${selectedDoc?._id === doc._id ? 'bg-brand/5 border-l-2 border-brand' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink text-xs">{doc.title}</p>
                    <p className="text-[10px] text-muted">{doc.fileName || 'General File'}</p>
                  </td>
                  <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{doc.category}</span></td>
                  <td className="px-4 py-3 text-muted">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => handleDelete(doc._id)} className="rounded p-1 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side: AI Copilot analysis split pane */}
        {selectedDoc && (
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded border border-line bg-surface p-4 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Document Details</h3>
              <p className="text-sm font-bold text-ink">{selectedDoc.title}</p>
              <p className="text-xs text-muted">Category: {selectedDoc.category} · File: {selectedDoc.fileName}</p>
              {selectedDoc.notes && (
                <div className="mt-2 bg-soft/50 rounded p-2 border border-line text-[11px] text-ink leading-relaxed">
                  <span className="font-bold text-[9px] text-muted block mb-0.5">Description notes:</span>
                  {selectedDoc.notes}
                </div>
              )}
            </div>

            <AICopilotCard 
              title="AI Doc Inspector"
              type="Document"
              data={aiData}
              loading={aiLoading}
            />
          </div>
        )}

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
