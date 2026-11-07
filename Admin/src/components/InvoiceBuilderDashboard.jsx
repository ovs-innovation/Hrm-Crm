import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCheckCircle, FiClock, FiAlertTriangle, FiTrendingUp, FiFileText } from 'react-icons/fi';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Proposal', label: 'Proposals' },
  { id: 'Invoice', label: 'Invoices' },
];

export default function InvoiceBuilderDashboard({
  invoices = [],
  filter = 'all',
  onFilterChange,
  onNewDocument,
  onSelectInvoice,
  cgstCollected = 0,
  sgstCollected = 0,
}) {
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? Number(inv.total || 0) : 0), 0);
  const pendingAmount = invoices.reduce((acc, inv) => {
    if (['Sent', 'Pending', 'Draft', 'Accepted'].includes(inv.status) && inv.docType === 'Invoice') {
      return acc + Number(inv.pendingAmount ?? inv.total ?? 0);
    }
    return acc;
  }, 0);
  const overdueAmount = invoices.reduce((acc, inv) => acc + (inv.status === 'Overdue' ? Number(inv.total || 0) : 0), 0);
  const paidCount = invoices.filter((inv) => inv.status === 'Paid').length;
  const proposalCount = invoices.filter((inv) => inv.docType === 'Proposal' || inv.docType === 'Quote').length;

  const visible = invoices.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'Proposal') return inv.docType === 'Proposal' || inv.docType === 'Quote';
    return inv.docType === 'Invoice';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">Project proposals and GST tax invoices for clients.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNewDocument('Proposal')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <FiFileText className="h-4 w-4" /> New proposal
          </button>
          <button
            type="button"
            onClick={() => onNewDocument('Invoice')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            <FiPlus className="h-4 w-4" /> New GST invoice
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Paid revenue', value: formatINR(totalRevenue), icon: FiTrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { title: 'Open invoices', value: formatINR(pendingAmount), icon: FiClock, color: 'text-amber-600 bg-amber-50' },
          { title: 'Overdue', value: formatINR(overdueAmount), icon: FiAlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { title: 'Paid / Proposals', value: `${paidCount} / ${proposalCount}`, icon: FiCheckCircle, color: 'text-brand bg-brand/10' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.title}</span>
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold text-slate-950">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">GST from paid invoices</h4>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <span className="text-slate-400">CGST</span>
              <div className="mt-0.5 font-bold text-slate-800">{formatINR(cgstCollected)}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <span className="text-slate-400">SGST</span>
              <div className="mt-0.5 font-bold text-slate-800">{formatINR(sgstCollected)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-end lg:col-span-2">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange?.(f.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filter === f.id ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Documents</h3>
          <span className="text-xs font-medium text-slate-400">{visible.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Number</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((inv) => (
                <tr
                  key={inv._id || inv.invoiceNumber}
                  onClick={() => onSelectInvoice(inv)}
                  className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-bold text-slate-800">#{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {inv.docType === 'Invoice' ? 'Invoice' : 'Proposal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{inv.customerName || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{inv.invoiceDate || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : inv.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-600'
                            : inv.status === 'Accepted'
                              ? 'bg-brand/10 text-brand'
                              : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums text-slate-800">{formatINR(inv.total)}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center italic text-slate-400">
                    No documents yet. Create a project proposal or GST invoice to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
