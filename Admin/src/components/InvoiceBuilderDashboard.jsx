import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiArrowUpRight, FiClock, FiCheckCircle, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function InvoiceBuilderDashboard({ invoices = [], onNewInvoice, onSelectInvoice }) {
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? Number(inv.total || 0) : 0), 0);
  const pendingAmount = invoices.reduce((acc, inv) => acc + (inv.status === 'Final' || inv.status === 'Pending' ? Number(inv.total || 0) : 0), 0);
  const overdueAmount = invoices.reduce((acc, inv) => acc + (inv.status === 'Overdue' ? Number(inv.total || 0) : 0), 0);
  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;

  const monthlyData = [120000, 185000, 140000, 290000, 210000, 320000, 410000];
  const maxVal = Math.max(...monthlyData);
  const points = monthlyData.map((val, idx) => {
    const x = 50 + idx * 95;
    const y = 160 - (val / maxVal) * 110;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500">Track and manage client invoices, generate tax compliance reports, and configure templates.</p>
        </div>
        <button
          onClick={onNewInvoice}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Revenue', value: formatINR(totalRevenue), icon: FiTrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { title: 'Pending Amount', value: formatINR(pendingAmount), icon: FiClock, color: 'text-amber-600 bg-amber-50' },
          { title: 'Overdue Amount', value: formatINR(overdueAmount), icon: FiAlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { title: 'Paid Invoices', value: paidCount, icon: FiCheckCircle, color: 'text-blue-600 bg-blue-50' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-950">Monthly Revenue</h3>
              <p className="text-xs text-slate-500">Live transaction progression</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
              +14.2% <FiArrowUpRight className="h-3 w-3" />
            </span>
          </div>

          <div className="relative h-48 w-full mt-6">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 650 180">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="50" y1="30" x2="620" y2="30" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="70" x2="620" y2="70" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="110" x2="620" y2="110" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="50" y1="160" x2="620" y2="160" stroke="#E2E8F0" strokeWidth="1.5" />

              <path
                d={`M 50,160 L ${points} L 620,160 Z`}
                fill="url(#chartGrad)"
              />

              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {monthlyData.map((val, idx) => {
                const x = 50 + idx * 95;
                const y = 160 - (val / maxVal) * 110;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="3"
                    className="cursor-pointer transition-all hover:r-7"
                  />
                );
              })}

              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m, idx) => (
                <text
                  key={m}
                  x={50 + idx * 95}
                  y="180"
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-semibold"
                >
                  {m}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-950">Top Customers</h3>
            <p className="text-xs text-slate-500">By total transaction value</p>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Acme Corporation', value: 290000, pct: '45%' },
              { name: 'Globex Holdings', value: 185000, pct: '30%' },
              { name: 'Initech Software', value: 95000, pct: '15%' }
            ].map((cust) => (
              <div key={cust.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{cust.name}</span>
                  <span>{formatINR(cust.value)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: cust.pct }} />
                </div>
              </div>
            ))}
          </div>

          <hr className="border-slate-100" />

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">GST Compliance Summary</h4>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400">CGST Collected</span>
                <div className="font-bold text-slate-800 mt-0.5">{formatINR(totalRevenue * 0.09)}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400">SGST Collected</span>
                <div className="font-bold text-slate-800 mt-0.5">{formatINR(totalRevenue * 0.09)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Invoices</h3>
          <span className="text-xs font-medium text-slate-400">{invoices.length} Total records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Invoice Number</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv._id || inv.invoiceNumber}
                  onClick={() => onSelectInvoice(inv)}
                  className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-800">#{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">{inv.customerName || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{inv.invoiceDate || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800 tabular-nums">{formatINR(inv.total)}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No invoices generated yet. Create a draft or import items to get started.
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
