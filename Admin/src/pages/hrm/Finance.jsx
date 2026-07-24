import React, { useState } from 'react';
import { Card } from '../../components';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('deposit');

  const deposits = [
    { id: 1, account: 'Business Account (Chase)', amount: '$5,000.00', payer: 'ACME Corp', category: 'Project Invoicing', ref: 'Ref #12459', date: 'Oct 20, 2026' },
    { id: 2, account: 'Reserve Fund (Wells Fargo)', amount: '$12,500.00', payer: 'Partner Inc', category: 'Milestone Release', ref: 'Ref #98231', date: 'Oct 18, 2026' },
  ];

  const expenses = [
    { id: 1, account: 'Business Account (Chase)', amount: '$1,200.00', payee: 'AWS Hosting', category: 'IT Infrastructure', ref: 'Ref #INV-928', date: 'Oct 22, 2026' },
    { id: 2, account: 'Petty Cash', amount: '$150.00', payee: 'Office Depot', category: 'Office Supplies', ref: 'Ref #OFC-23', date: 'Oct 21, 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Finance Manager</h2>
          <p className="text-muted text-muted text-sm">Monitor office deposits, expenditures, and account balances</p>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-indigo-500">
          <div className="bg-brand/15 p-3 rounded-lg text-brand">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Chase Business Balance</p>
            <h3 className="text-2xl font-bold">$42,390.00</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="bg-brand/10 p-3 rounded-lg text-brand">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Monthly Inflow</p>
            <h3 className="text-2xl font-bold text-brand">+$17,500.00</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-brand">
          <div className="bg-brand/10 bg-brand/10 p-3 rounded-lg text-brand">
            <FiTrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Monthly Outflow</p>
            <h3 className="text-2xl font-bold text-brand">-$1,350.00</h3>
          </div>
        </Card>
      </div>

      <div className="flex border-b border-line">
        {[
          { id: 'deposit', label: 'Deposits / Inflow' },
          { id: 'expense', label: 'Expenses / Outflow' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all -mb-px
              ${activeTab === tab.id 
                ? 'border-brand text-brand border-brand text-brand' 
                : 'border-transparent text-muted hover:text-ink'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'deposit' && (
        <Card title="Deposits Ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payer</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {deposits.map((row) => (
                  <tr key={row.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{row.account}</td>
                    <td className="py-4 text-brand font-bold font-mono">{row.amount}</td>
                    <td className="py-4 text-ink text-muted">{row.payer}</td>
                    <td className="py-4 text-muted">{row.category}</td>
                    <td className="py-4 text-xs font-mono text-muted">{row.ref}</td>
                    <td className="py-4 text-muted text-muted">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'expense' && (
        <Card title="Expenses Ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payee</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {expenses.map((row) => (
                  <tr key={row.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{row.account}</td>
                    <td className="py-4 text-brand font-bold font-mono">{row.amount}</td>
                    <td className="py-4 text-ink text-muted">{row.payee}</td>
                    <td className="py-4 text-muted">{row.category}</td>
                    <td className="py-4 text-xs font-mono text-muted">{row.ref}</td>
                    <td className="py-4 text-muted text-muted">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Finance;
