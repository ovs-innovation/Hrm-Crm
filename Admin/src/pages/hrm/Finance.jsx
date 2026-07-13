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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Finance Manager</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor office deposits, expenditures, and account balances</p>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-indigo-500">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Chase Business Balance</p>
            <h3 className="text-2xl font-bold">$42,390.00</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Monthly Inflow</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-450">+$17,500.00</h3>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-red-500">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400">
            <FiTrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Monthly Outflow</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-450">-$1,350.00</h3>
          </div>
        </Card>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'deposit', label: 'Deposits / Inflow' },
          { id: 'expense', label: 'Expenses / Outflow' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all -mb-px
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
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
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payer</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deposits.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{row.account}</td>
                    <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold font-mono">{row.amount}</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">{row.payer}</td>
                    <td className="py-4 text-slate-500">{row.category}</td>
                    <td className="py-4 text-xs font-mono text-slate-400">{row.ref}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{row.date}</td>
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
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payee</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{row.account}</td>
                    <td className="py-4 text-red-600 dark:text-red-400 font-bold font-mono">{row.amount}</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">{row.payee}</td>
                    <td className="py-4 text-slate-500">{row.category}</td>
                    <td className="py-4 text-xs font-mono text-slate-400">{row.ref}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{row.date}</td>
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
