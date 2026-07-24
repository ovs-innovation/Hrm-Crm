import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowRight, FiBriefcase, FiDollarSign, FiTarget, FiCheckSquare } from 'react-icons/fi';
import api from '../../services/api';

const SETUP_ITEMS = [
  { id: 'team', label: 'Invite team members', href: '/hrm/employees' },
  { id: 'pipeline', label: 'Add your first deal', href: '/crm/deals' },
  { id: 'import', label: 'Import leads', href: '/crm/leads' },
  { id: 'accounts', label: 'Create an account', href: '/crm/accounts' },
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const StatCard = ({ label, value, sub, icon: Icon, to }) => (
  <Link to={to} className="group flex flex-col justify-between rounded border border-line bg-surface p-4 hover:border-brand/30">
    <div className="flex items-start justify-between gap-3">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <Icon className="h-4 w-4 text-muted group-hover:text-brand" strokeWidth={1.75} />
    </div>
    <div className="mt-3">
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  </Link>
);

const CrmHome = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const firstName = (adminInfo.name || 'Admin').split(' ')[0];
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const pipeline = stats?.pipelineByStage || [];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[13px] text-muted">{today}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">Good morning, {firstName}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/crm/leads" className="btn-outline px-3 py-2 text-[13px]">Add lead</Link>
          <Link to="/crm/deals" className="btn-primary px-3 py-2 text-[13px]">New deal</Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open deals" value={loading ? '…' : stats?.openDeals ?? 0} sub={loading ? '' : formatINR(stats?.pipelineValue)} icon={FiDollarSign} to="/crm/deals" />
        <StatCard label="Leads" value={loading ? '…' : stats?.leads ?? 0} sub={`${stats?.newLeads ?? 0} new this week`} icon={FiTarget} to="/crm/leads" />
        <StatCard label="Accounts" value={loading ? '…' : stats?.accounts ?? 0} sub="Active accounts" icon={FiBriefcase} to="/crm/accounts" />
        <StatCard label="Tasks due" value={loading ? '…' : stats?.tasksDue ?? 0} sub="Today & overdue" icon={FiCheckSquare} to="/crm/tasks" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold text-ink">Pipeline by stage</h2>
            <Link to="/crm/deals" className="text-[13px] font-medium text-brand">View deals</Link>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Deals</th>
                <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(pipeline.length ? pipeline : [{ stage: 'Qualification', count: 0, value: 0 }]).map((row) => (
                <tr key={row.stage} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{row.stage}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{row.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{formatINR(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="rounded border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold text-ink">Get started</h2>
          </div>
          <ul className="divide-y divide-line">
            {SETUP_ITEMS.map((item) => (
              <li key={item.id}>
                <Link to={item.href} className="flex items-center justify-between px-4 py-3 text-[13px] text-ink hover:bg-soft">
                  {item.label}
                  <FiArrowRight className="h-3.5 w-3.5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default CrmHome;
