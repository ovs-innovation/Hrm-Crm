import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiFileText, FiPrinter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import { printInvoice } from '../../components/InvoicePrintView';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const emptyItem = { description: '', quantity: 1, rate: 0 };

const Invoices = () => {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({
    type: 'Quote', client: '', deal: '', dueDate: '', notes: '', taxRate: 18, items: [{ ...emptyItem }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const [inv, cl, dl, settings] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients'),
        api.get('/deals'),
        api.get('/settings/company'),
      ]);
      setItems(inv.data);
      setClients(cl.data);
      setDeals(dl.data);
      setCompany(settings.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const submit = async (e) => {
    e.preventDefault();
    const client = clients.find((c) => c._id === form.client);
    const deal = deals.find((d) => d._id === form.deal);
    try {
      await api.post('/invoices', {
        ...form,
        clientName: client ? `${client.name} · ${client.company}` : '',
        dealTitle: deal?.title,
      });
      toast.success(`${form.type} created`);
      setModal(false);
      setForm({ type: 'Quote', client: '', deal: '', dueDate: '', notes: '', taxRate: 18, items: [{ ...emptyItem }] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const convert = async (id) => {
    await api.post(`/invoices/${id}/convert`);
    toast.success('Converted to invoice');
    load();
  };

  const handlePrint = (row) => {
    printInvoice(row, company);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  const updateItem = (idx, key, val) => {
    setForm((f) => {
      const itemsCopy = [...f.items];
      itemsCopy[idx] = { ...itemsCopy[idx], [key]: val };
      return { ...f, items: itemsCopy };
    });
  };

  return (
    <PageShell
      title="Quotes & Invoices"
      description="Create quotes, convert to invoices, track billing"
      count={filtered.length}
      actions={
        <button type="button" onClick={() => setModal(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> New quote
        </button>
      }
    >
      <div className="mb-3 flex gap-2">
        {['all', 'Quote', 'Invoice'].map((t) => (
          <button key={t} type="button" onClick={() => setFilter(t)} className={`h-8 rounded border px-3 text-[13px] ${filter === t ? 'border-brand bg-brand-xlight text-brand' : 'border-line text-muted'}`}>
            {t === 'all' ? 'All' : t + 's'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Number</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No quotes or invoices yet.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{row.number}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3 text-muted">{row.clientName || '—'}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(row.total)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handlePrint(row)} className="mr-2 rounded p-1.5 text-muted hover:text-ink" title="Print / PDF"><FiPrinter className="h-3.5 w-3.5" /></button>
                  {row.type === 'Quote' && (
                    <button type="button" onClick={() => convert(row._id)} className="mr-2 rounded p-1.5 text-brand hover:bg-brand-xlight" title="Convert to invoice"><FiFileText className="h-3.5 w-3.5" /></button>
                  )}
                  <button type="button" onClick={() => remove(row._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/30 p-4">
          <div className="my-8 w-full max-w-2xl rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New quote</div>
            <form onSubmit={submit} className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Client</label><select required className="app-input h-9 text-[13px]" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}><option value="">Select…</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.company}</option>)}</select></div>
                <div><label className="app-label mb-1 block text-[13px]">Linked deal</label><select className="app-input h-9 text-[13px]" value={form.deal} onChange={(e) => setForm({ ...form, deal: e.target.value })}><option value="">Optional</option>{deals.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Due date</label><input type="date" className="app-input h-9 text-[13px]" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Tax %</label><input type="number" className="app-input h-9 text-[13px]" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} /></div>
              </div>
              <div>
                <label className="app-label mb-1 block text-[13px]">Line items</label>
                {form.items.map((item, idx) => (
                  <div key={idx} className="mb-2 grid grid-cols-[1fr_80px_100px] gap-2">
                    <input required placeholder="Description" className="app-input h-9 text-[13px]" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                    <input type="number" min="1" placeholder="Qty" className="app-input h-9 text-[13px]" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                    <input type="number" min="0" placeholder="Rate" className="app-input h-9 text-[13px]" value={item.rate} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} />
                  </div>
                ))}
                <button type="button" className="text-[12px] text-brand hover:underline" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }))}>+ Add line</button>
              </div>
              <div><label className="app-label mb-1 block text-[13px]">Notes</label><textarea className="app-input w-full text-[13px]" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Create quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Invoices;
