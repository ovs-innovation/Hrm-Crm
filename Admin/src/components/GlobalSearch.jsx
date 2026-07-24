import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlobalSearch = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (path) => {
    setOpen(false);
    setQ('');
    navigate(path);
  };

  const hasAny = results && (
    results.clients?.length || results.employees?.length || results.deals?.length
    || results.projects?.length || results.tickets?.length
  );

  return (
    <div className="relative mx-auto hidden max-w-md flex-1 md:block" ref={ref}>
      <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <input
        type="search"
        placeholder="Search records"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
        className="h-8 w-full rounded border border-line bg-canvas pl-8 pr-3 text-[13px] text-ink placeholder:text-muted outline-none focus:border-brand"
      />
      {open && hasAny && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded border border-line bg-surface shadow-lg">
          {results.deals?.length > 0 && (
            <Section title="Deals" items={results.deals.map((d) => ({ key: d._id, label: d.title, sub: d.stage, path: '/crm/deals' }))} onGo={go} />
          )}
          {results.clients?.length > 0 && (
            <Section title="Accounts / Leads" items={results.clients.map((c) => ({ key: c._id, label: c.company || c.name, sub: c.status, path: c.status === 'Lead' ? '/crm/leads' : '/crm/accounts' }))} onGo={go} />
          )}
          {results.employees?.length > 0 && (
            <Section title="Employees" items={results.employees.map((e) => ({ key: e._id, label: e.name, sub: e.department, path: '/hrm/employees' }))} onGo={go} />
          )}
          {results.tickets?.length > 0 && (
            <Section title="Tickets" items={results.tickets.map((t) => ({ key: t._id, label: t.subject, sub: t.status, path: '/hrm/tickets' }))} onGo={go} />
          )}
        </div>
      )}
    </div>
  );
};

const Section = ({ title, items, onGo }) => (
  <div className="border-b border-line last:border-0">
    <p className="bg-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
    {items.map((item) => (
      <button key={item.key} type="button" onClick={() => onGo(item.path)} className="flex w-full flex-col px-3 py-2 text-left hover:bg-soft">
        <span className="text-[13px] text-ink">{item.label}</span>
        {item.sub && <span className="text-[12px] text-muted">{item.sub}</span>}
      </button>
    ))}
  </div>
);

export default GlobalSearch;
