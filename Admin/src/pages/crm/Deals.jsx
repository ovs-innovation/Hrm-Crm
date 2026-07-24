import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiList, FiGrid, FiMessageSquare } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import ActivityTimeline from '../../components/ActivityTimeline';
import api from '../../services/api';

const STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', amount: '', stage: 'Qualification', client: '', clientName: '', expectedCloseDate: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsRes, clientsRes] = await Promise.all([
        api.get('/deals'),
        api.get('/clients'),
      ]);
      setDeals(dealsRes.data);
      setClients(clientsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const client = clients.find((c) => c._id === formData.client);
    await api.post('/deals', {
      ...formData,
      amount: Number(formData.amount) || 0,
      clientName: client ? `${client.name} · ${client.company}` : formData.clientName,
    });
    setIsModalOpen(false);
    setFormData({ title: '', amount: '', stage: 'Qualification', client: '', clientName: '', expectedCloseDate: '' });
    fetchData();
  };

  const updateStage = async (id, stage) => {
    await api.put(`/deals/${id}`, { stage });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deal?')) return;
    await api.delete(`/deals/${id}`);
    if (detailDeal?._id === id) setDetailDeal(null);
    fetchData();
  };

  const onDrop = async (stage) => {
    if (!dragId) return;
    const deal = deals.find((d) => d._id === dragId);
    if (deal && deal.stage !== stage) {
      await updateStage(dragId, stage);
    }
    setDragId(null);
  };

  const byStage = (stage) => deals.filter((d) => d.stage === stage);

  return (
    <PageShell
      title="Deals"
      description="Sales pipeline and deal tracking"
      count={deals.length}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-line">
            <button type="button" onClick={() => setView('list')} className={`flex h-8 items-center gap-1 px-2.5 text-[13px] ${view === 'list' ? 'bg-brand-xlight text-brand' : 'text-muted'}`}><FiList className="h-3.5 w-3.5" /> List</button>
            <button type="button" onClick={() => setView('board')} className={`flex h-8 items-center gap-1 border-l border-line px-2.5 text-[13px] ${view === 'board' ? 'bg-brand-xlight text-brand' : 'text-muted'}`}><FiGrid className="h-3.5 w-3.5" /> Board</button>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> New deal
          </button>
        </div>
      }
    >
      {view === 'list' ? (
        <div className="overflow-hidden rounded border border-line bg-surface">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Deal</th>
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                <th className="px-4 py-2.5 font-medium">Close date</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : deals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No deals in pipeline.</td></tr>
              ) : deals.map((deal) => (
                <tr key={deal._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setDetailDeal(deal)} className="font-medium text-brand hover:underline">{deal.title}</button>
                  </td>
                  <td className="px-4 py-3 text-muted">{deal.clientName || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={deal.stage}
                      onChange={(e) => updateStage(deal._id, e.target.value)}
                      className="h-8 rounded border border-line bg-surface px-2 text-[13px] text-ink"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{formatINR(deal.amount)}</td>
                  <td className="px-4 py-3 text-muted">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setDetailDeal(deal)} className="mr-1 rounded p-1.5 text-muted hover:text-brand" title="Activity"><FiMessageSquare className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => handleDelete(deal._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="min-w-[220px] flex-1 rounded border border-line bg-soft/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage)}
            >
              <div className="border-b border-line px-3 py-2">
                <p className="text-[12px] font-semibold text-ink">{stage}</p>
                <p className="text-[11px] text-muted">{byStage(stage).length} · {formatINR(byStage(stage).reduce((s, d) => s + (d.amount || 0), 0))}</p>
              </div>
              <div className="space-y-2 p-2 min-h-[200px]">
                {byStage(stage).map((deal) => (
                  <div
                    key={deal._id}
                    draggable
                    onDragStart={() => setDragId(deal._id)}
                    onClick={() => setDetailDeal(deal)}
                    className="cursor-grab rounded border border-line bg-surface p-2.5 shadow-sm active:cursor-grabbing"
                  >
                    <p className="text-[13px] font-medium text-ink">{deal.title}</p>
                    <p className="mt-1 text-[12px] text-muted truncate">{deal.clientName || 'No account'}</p>
                    <p className="mt-1 text-[13px] font-semibold tabular-nums text-brand">{formatINR(deal.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New deal</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div><label className="app-label mb-1 block text-[13px]">Deal name</label><input required className="app-input h-9 text-[13px]" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Amount (₹)</label><input type="number" min="0" className="app-input h-9 text-[13px]" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Stage</label><select className="app-input h-9 text-[13px]" value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Linked account</label><select className="app-input h-9 text-[13px]" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })}><option value="">Select…</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.company}</option>)}</select></div>
                <div><label className="app-label mb-1 block text-[13px]">Expected close</label><input type="date" className="app-input h-9 text-[13px]" value={formData.expectedCloseDate} onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Create deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="font-semibold text-[15px] text-ink">{detailDeal.title}</p>
                <p className="text-[12px] text-muted">{detailDeal.stage} · {formatINR(detailDeal.amount)}</p>
              </div>
              <button type="button" className="btn-outline h-8 px-2 text-[13px]" onClick={() => setDetailDeal(null)}>Close</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <ActivityTimeline entityType="Deal" entityId={detailDeal._id} entityLabel={detailDeal.title} />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Deals;
