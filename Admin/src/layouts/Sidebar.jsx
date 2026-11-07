import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import VastoraLogo from '../components/VastoraLogo';
import { getNavAccess } from '../utils/roleAccess';
import {
  FiHome,
  FiBarChart2,
  FiChevronRight,
  FiX,
  FiUser,
  FiUsers,
  FiCheckSquare,
  FiSettings,
  FiGrid,
  FiHeadphones,
} from 'react-icons/fi';

const SparkleIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 3.5 13.1 8 17.5 9.2 13.1 10.4 12 14.8 10.9 10.4 6.5 9.2 10.9 8 12 3.5Z" />
    <path d="M18 14.2 18.55 16 20.3 16.55 18.55 17.1 18 18.8 17.45 17.1 15.7 16.55 17.45 16 18 14.2Z" />
  </svg>
);

const SECTIONS = [
  {
    id: 'crm',
    title: 'CRM',
    access: 'crm',
    icon: FiUser,
    items: [
      { title: 'Leads', to: '/crm/leads' },
      { title: 'Contacts', to: '/crm/contacts' },
      { title: 'Accounts', to: '/crm/accounts' },
      { title: 'Deals', to: '/crm/deals' },
      {
        title: 'Sales',
        children: [
          { title: 'Billing', to: '/crm/invoices' },
          { title: 'Meetings', to: '/crm/meetings' },
          { title: 'Calls', to: '/crm/calls' },
          { title: 'Campaigns', to: '/crm/campaigns' },
          { title: 'Documents', to: '/crm/documents' },
        ],
      },
    ],
  },
  {
    id: 'hrms',
    title: 'HRMS',
    access: 'hrms',
    icon: FiUsers,
    items: [
      { title: 'Employees', to: '/hrm/employees' },
      { title: 'Attendance', to: '/hrm/attendance' },
      { title: 'Work from home', to: '/hrm/wfh' },
      { title: 'Leave', to: '/hrm/leaves' },
      { title: 'Payroll', to: '/hrm/payroll' },
      { title: 'Recruitment', to: '/hrm/recruitment' },
      {
        title: 'Organization',
        children: [
          { title: 'Departments', to: '/hrm/department' },
          { title: 'Designations', to: '/hrm/designation' },
          { title: 'Org chart', to: '/hrm/org-chart' },
          { title: 'Shift roster', to: '/hrm/shift-roster' },
          { title: 'Holidays', to: '/hrm/holiday' },
        ],
      },
      {
        title: 'Announcements',
        children: [
          { title: 'Announcements', to: '/hrm/announcements' },
          { title: 'Appreciation', to: '/hrm/appreciation' },
          { title: 'Daily reports', to: '/hrm/daily-reports' },
        ],
      },
    ],
  },
  {
    id: 'work',
    title: 'Work',
    access: 'work',
    icon: FiCheckSquare,
    items: [
      { title: 'Projects', to: '/work/projects' },
      { title: 'Tasks', to: '/work/tasks' },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    access: 'workspace',
    icon: FiGrid,
    items: [{ title: 'Channels', to: '/workspace' }],
  },
  {
    id: 'support',
    title: 'Support',
    access: 'support',
    icon: FiHeadphones,
    items: [{ title: 'Tickets', to: '/support/tickets' }],
  },
  {
    id: 'ai',
    title: 'AI',
    access: 'ai',
    icon: SparkleIcon,
    items: [
      { title: 'Copilot', to: '/ai' },
      { title: 'Knowledge base', to: '/ai/knowledge' },
      { title: 'Usage', to: '/ai/usage' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    access: 'reports',
    icon: FiBarChart2,
    items: [
      { title: 'CRM', to: '/reports?report=sales-overview' },
      { title: 'HR', to: '/reports?report=attendance' },
      { title: 'Work', to: '/reports?report=tasks' },
      { title: 'Finance', to: '/reports?report=payroll' },
      { title: 'Builder', to: '/reports/builder' },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    access: 'administration',
    icon: FiSettings,
    items: [
      { title: 'Company', to: '/settings' },
      { title: 'Audit', to: '/settings#audit' },
      { title: 'Setup', to: '/setup-wizard' },
    ],
  },
];

const itemIsActive = (to, location) => {
  const hashAt = to.indexOf('#');
  const hash = hashAt >= 0 ? to.slice(hashAt) : '';
  const withoutHash = hashAt >= 0 ? to.slice(0, hashAt) : to;
  const queryAt = withoutHash.indexOf('?');
  const path = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
  const query = queryAt >= 0 ? withoutHash.slice(queryAt + 1) : '';

  if (query) {
    if (location.pathname !== path) return false;
    const want = new URLSearchParams(query);
    const have = new URLSearchParams(location.search);
    for (const [key, value] of want) {
      if (have.get(key) !== value) return false;
    }
    return true;
  }

  if (hash) return location.pathname === path && location.hash === hash;
  if (path === '/settings') return location.pathname === '/settings' && location.hash !== '#audit';
  if (path === '/' || path === '/ai') return location.pathname === path;
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
};

const groupHasActive = (items, location) =>
  items.some((item) => (item.to ? itemIsActive(item.to, location) : groupHasActive(item.children || [], location)));

const TopButton = ({ icon: Icon, title, open, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    className={`grid h-9 w-full grid-cols-[15px_minmax(0,1fr)_14px] items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
      active ? 'bg-brand-xlight font-medium text-brand' : 'text-ink/75 hover:bg-soft hover:text-ink'
    }`}
  >
    <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
    <span className="truncate">{title}</span>
    <FiChevronRight className={`h-3.5 w-3.5 justify-self-end text-muted transition-transform ${open ? 'rotate-90 text-brand' : ''}`} />
  </button>
);

const ChildLink = ({ to, title, onClick, nested }) => {
  const location = useLocation();
  const active = itemIsActive(to, location);
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex h-8 items-center rounded-lg pr-2.5 text-[13px] transition-colors ${
        nested ? 'pl-[48px]' : 'pl-[35px]'
      } ${active ? 'bg-brand-xlight font-medium text-brand' : 'text-ink/70 hover:bg-soft hover:text-ink'}`}
    >
      <span className="truncate">{title}</span>
    </NavLink>
  );
};

const SubGroup = ({ title, items, onClick, location }) => {
  const contains = groupHasActive(items, location);
  const [open, setOpen] = useState(contains);
  const [tracked, setTracked] = useState(contains);
  if (contains !== tracked) {
    setTracked(contains);
    if (contains) setOpen(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-2 rounded-lg pl-[35px] pr-2.5 text-left text-[13px] text-ink/70 transition-colors hover:bg-soft hover:text-ink"
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <FiChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map((item) => (
            <ChildLink key={item.to} to={item.to} title={item.title} onClick={onClick} nested />
          ))}
        </div>
      )}
    </div>
  );
};

const Section = ({ title, icon, items, onClick, location }) => {
  const contains = groupHasActive(items, location);
  const [open, setOpen] = useState(contains);
  const [tracked, setTracked] = useState(contains);
  if (contains !== tracked) {
    setTracked(contains);
    if (contains) setOpen(true);
  }

  return (
    <div>
      <TopButton icon={icon} title={title} open={open} active={contains && !open} onClick={() => setOpen((value) => !value)} />
      {open && (
        <div className="mt-0.5 space-y-0.5 pb-1">
          {items.map((item) =>
            item.children ? (
              <SubGroup key={item.title} title={item.title} items={item.children} onClick={onClick} location={location} />
            ) : (
              <ChildLink key={item.to} to={item.to} title={item.title} onClick={onClick} />
            )
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const access = getNavAccess(adminInfo.role);
  const close = () => setIsOpen(false);
  const homeActive = location.pathname === '/';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={close} aria-hidden />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-line bg-surface transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-3">
          <VastoraLogo variant="header" />
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-muted hover:bg-soft hover:text-ink md:hidden"
            aria-label="Close menu"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {access.dashboard && (
            <NavLink
              to="/"
              end
              onClick={close}
              className={`grid h-9 grid-cols-[15px_minmax(0,1fr)_14px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
                homeActive ? 'bg-brand-xlight font-medium text-brand' : 'text-ink/75 hover:bg-soft hover:text-ink'
              }`}
            >
              <FiHome className="h-[15px] w-[15px]" strokeWidth={1.75} />
              <span className="truncate">Dashboard</span>
              <span />
            </NavLink>
          )}

          {SECTIONS.filter((section) => access[section.access]).map((section) => (
            <Section
              key={section.id}
              title={section.title}
              icon={section.icon}
              items={section.items}
              onClick={close}
              location={location}
            />
          ))}
        </nav>

        {adminInfo.role && (
          <div className="border-t border-line px-4 py-3">
            <p className="truncate text-[13px] font-medium text-ink">{adminInfo.name}</p>
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-muted">{adminInfo.role}</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
