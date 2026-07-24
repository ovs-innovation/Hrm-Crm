import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const STATUS_STYLES = {
  Active: 'bg-brand-xlight text-brand',
  Lead: 'bg-soft text-ink',
  Inactive: 'bg-soft text-muted',
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Lead',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      setFormData({ name: '', company: '', email: '', phone: '', status: 'Lead', notes: '' });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to save account: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Delete this account?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <PageShell
      title="Accounts"
      description="Companies and organizations you work with"
      count={clients.length}
      actions={
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add account
        </button>
      }
    >

      <div className="overflow-hidden rounded border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Account name</th>
                <th className="px-4 py-2.5 font-medium">Primary contact</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    Loading accounts…
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-[13px] text-muted">No accounts yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-3 text-[13px] font-medium text-brand hover:text-brand-hover"
                    >
                      Add your first account
                    </button>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                    <td className="px-4 py-3 font-medium text-ink">{client.company}</td>
                    <td className="px-4 py-3 text-ink">{client.name}</td>
                    <td className="px-4 py-3 text-muted">{client.email}</td>
                    <td className="px-4 py-3 text-muted">{client.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[client.status] || STATUS_STYLES.Lead
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteClient(client._id)}
                        className="rounded p-1.5 text-muted hover:bg-soft hover:text-danger"
                        aria-label="Delete account"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-[15px] font-semibold text-ink">New account</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Contact name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="app-input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Account name</label>
                  <input
                    required
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="app-input h-9 text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="app-input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="app-input h-9 text-[13px]"
                  />
                </div>
              </div>
              <div>
                <label className="app-label mb-1 block text-[13px]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="app-input h-9 text-[13px]"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="app-label mb-1 block text-[13px]">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="app-input min-h-[80px] resize-none text-[13px]"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline h-9 px-3 text-[13px]">
                  Cancel
                </button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">
                  Save account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Clients;
