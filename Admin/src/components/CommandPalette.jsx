import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PAGES = [
  { label: 'Dashboard', path: '/' },
  { label: 'Leads', path: '/crm/leads' },
  { label: 'Contacts', path: '/crm/contacts' },
  { label: 'Accounts', path: '/crm/accounts' },
  { label: 'Deals', path: '/crm/deals' },
  { label: 'Quotes & Invoices', path: '/crm/invoices' },
  { label: 'Meetings', path: '/crm/meetings' },
  { label: 'Calls', path: '/crm/calls' },
  { label: 'Campaigns', path: '/crm/campaigns' },
  { label: 'Documents', path: '/crm/documents' },
  { label: 'Employees', path: '/hrm/employees' },
  { label: 'Attendance', path: '/hrm/attendance' },
  { label: 'Leave', path: '/hrm/leaves' },
  { label: 'Payroll', path: '/hrm/payroll' },
  { label: 'Recruitment', path: '/hrm/recruitment' },
  { label: 'Projects', path: '/work/projects' },
  { label: 'Tasks', path: '/work/tasks' },
  { label: 'Workspace', path: '/workspace' },
  { label: 'Tickets', path: '/support/tickets' },
  { label: 'Copilot', path: '/ai' },
  { label: 'Knowledge base', path: '/ai/knowledge' },
  { label: 'Reports', path: '/reports' },
  { label: 'Company settings', path: '/settings' },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setRecords([]);
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setRecords([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        const rows = [
          ...(data.clients || []).map((c) => ({ id: c._id, label: c.company || c.name, hint: c.status, path: c.status === 'Lead' ? '/crm/leads' : '/crm/accounts' })),
          ...(data.deals || []).map((d) => ({ id: d._id, label: d.title, hint: 'Deal', path: '/crm/deals' })),
          ...(data.employees || []).map((e) => ({ id: e._id, label: e.name, hint: 'Employee', path: '/hrm/employees' })),
          ...(data.projects || []).map((p) => ({ id: p._id, label: p.name, hint: 'Project', path: '/work/projects' })),
          ...(data.tickets || []).map((ticket) => ({ id: ticket._id, label: ticket.subject, hint: 'Ticket', path: '/support/tickets' })),
        ];
        setRecords(rows.slice(0, 8));
      } catch {
        setRecords([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGES.filter((page) => !q || page.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const items = [...pages.map((p) => ({ ...p, hint: 'Go to' })), ...records];

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      go(items[active].path);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/40 px-4 pt-[12vh]">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          placeholder="Search pages and records"
          className="h-11 w-full border-b border-line bg-surface px-4 text-[14px] text-ink outline-none placeholder:text-muted"
        />
        <ul className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-6 text-[13px] text-muted">No matches.</li>
          )}
          {items.map((item, index) => (
            <li key={`${item.path}-${item.label}-${item.id || index}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item.path)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-[13px] ${index === active ? 'bg-soft text-ink' : 'text-ink'}`}
              >
                <span>{item.label}</span>
                <span className="text-[12px] text-muted">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-2 text-[11px] text-muted">Ctrl+K to toggle · Enter to open</div>
      </div>
    </div>
  );
};

export default CommandPalette;
