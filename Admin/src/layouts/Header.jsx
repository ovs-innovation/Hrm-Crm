import React, { useEffect, useRef, useState } from 'react';
import { FiMenu, FiChevronDown } from 'react-icons/fi';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import { useAppSocket } from '../context/SocketContext';

const CRUMBS = [
  ['/crm/leads', [['CRM', '/crm/leads'], ['Leads', '/crm/leads']]],
  ['/crm/contacts', [['CRM', '/crm/contacts'], ['Contacts', '/crm/contacts']]],
  ['/crm/accounts', [['CRM', '/crm/accounts'], ['Accounts', '/crm/accounts']]],
  ['/crm/deals', [['CRM', '/crm/deals'], ['Deals', '/crm/deals']]],
  ['/crm/invoices', [['CRM', '/crm/deals'], ['Sales', '/crm/invoices'], ['Quotes & Invoices', '/crm/invoices']]],
  ['/crm/meetings', [['CRM', '/crm/leads'], ['Sales', '/crm/meetings'], ['Meetings', '/crm/meetings']]],
  ['/crm/calls', [['CRM', '/crm/leads'], ['Sales', '/crm/calls'], ['Calls', '/crm/calls']]],
  ['/crm/campaigns', [['CRM', '/crm/leads'], ['Sales', '/crm/campaigns'], ['Campaigns', '/crm/campaigns']]],
  ['/crm/documents', [['CRM', '/crm/leads'], ['Sales', '/crm/documents'], ['Documents', '/crm/documents']]],
  ['/hrm/employees', [['HRMS', '/hrm/employees'], ['Employees', '/hrm/employees']]],
  ['/hrm/attendance', [['HRMS', '/hrm/employees'], ['Attendance', '/hrm/attendance']]],
  ['/hrm/leaves', [['HRMS', '/hrm/employees'], ['Leave', '/hrm/leaves']]],
  ['/hrm/payroll', [['HRMS', '/hrm/employees'], ['Payroll', '/hrm/payroll']]],
  ['/hrm/recruitment', [['HRMS', '/hrm/employees'], ['Recruitment', '/hrm/recruitment']]],
  ['/hrm/department', [['HRMS', '/hrm/employees'], ['Organization', '/hrm/department'], ['Departments', '/hrm/department']]],
  ['/hrm/designation', [['HRMS', '/hrm/employees'], ['Organization', '/hrm/designation'], ['Designations', '/hrm/designation']]],
  ['/hrm/org-chart', [['HRMS', '/hrm/employees'], ['Organization', '/hrm/org-chart'], ['Org chart', '/hrm/org-chart']]],
  ['/hrm/shift-roster', [['HRMS', '/hrm/employees'], ['Organization', '/hrm/shift-roster'], ['Shift roster', '/hrm/shift-roster']]],
  ['/hrm/holiday', [['HRMS', '/hrm/employees'], ['Organization', '/hrm/holiday'], ['Holidays', '/hrm/holiday']]],
  ['/hrm/announcements', [['HRMS', '/hrm/employees'], ['Announcements', '/hrm/announcements']]],
  ['/hrm/appreciation', [['HRMS', '/hrm/employees'], ['Announcements', '/hrm/announcements'], ['Appreciation', '/hrm/appreciation']]],
  ['/hrm/daily-reports', [['HRMS', '/hrm/employees'], ['Announcements', '/hrm/announcements'], ['Daily reports', '/hrm/daily-reports']]],
  ['/work/projects', [['Work', '/work/projects'], ['Projects', '/work/projects']]],
  ['/work/tasks', [['Work', '/work/projects'], ['Tasks', '/work/tasks']]],
  ['/workspace', [['Workspace', '/workspace']]],
  ['/support/tickets', [['Support', '/support/tickets'], ['Tickets', '/support/tickets']]],
  ['/ai/knowledge', [['AI', '/ai'], ['Knowledge', '/ai/knowledge']]],
  ['/ai/usage', [['AI', '/ai'], ['Usage', '/ai/usage']]],
  ['/ai', [['AI', '/ai'], ['Copilot', '/ai']]],
  ['/reports/builder', [['Reports', '/reports'], ['Builder', '/reports/builder']]],
  ['/reports', [['Reports', '/reports']]],
  ['/settings', [['Administration', '/settings'], ['Company', '/settings']]],
  ['/setup-wizard', [['Administration', '/settings'], ['Setup', '/setup-wizard']]],
];

const ROUTE_TITLES = {
  '/': 'Home',
  '/crm/leads': 'Leads',
  '/crm/contacts': 'Contacts',
  '/crm/accounts': 'Accounts',
  '/crm/deals': 'Deals',
  '/crm/invoices': 'Quotes & Invoices',
  '/crm/forecasts': 'Forecasts',
  '/crm/documents': 'Documents',
  '/crm/campaigns': 'Campaigns',
  '/crm/meetings': 'Meetings',
  '/crm/calls': 'Calls',
  '/work/tasks': 'Tasks',
  '/work/projects': 'Projects',
  '/support/tickets': 'Tickets',
  '/ai': 'Copilot',
  '/ai/knowledge': 'Knowledge base',
  '/ai/usage': 'AI usage',
  '/reports': 'Reports',
  '/reports/builder': 'Report builder',
  '/workspace': 'Workspace',
  '/hrm/employees': 'Employees',
  '/settings': 'Settings',
};

const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const { presence, setStatus } = useAppSocket();
  const myStatus = presence[String(adminInfo._id)]?.status || 'online';
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setStatusOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  const adminName = adminInfo.name || 'User';
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const crumb = CRUMBS.find(([prefix]) => location.pathname === prefix || (prefix !== '/ai' && location.pathname.startsWith(prefix)));
  const trail = crumb ? crumb[1] : [['Dashboard', '/']];
  const pageTitle = ROUTE_TITLES[location.pathname] || trail[trail.length - 1][0];

  const handleLogout = async () => {
    try {
      await api.post('/auth/admin/logout', {});
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-11 items-center gap-3 border-b border-line bg-surface px-4">
      <button
        type="button"
        onClick={toggleMobileMenu}
        className="rounded p-1.5 text-muted hover:bg-soft hover:text-ink md:hidden"
        aria-label="Open menu"
      >
        <FiMenu className="h-[18px] w-[18px]" />
      </button>

      <nav className="hidden min-w-0 items-center gap-1 truncate text-[13px] md:flex" aria-label="Breadcrumb">
        {trail.map(([label, to], index) => (
          <span key={to + label} className="flex min-w-0 items-center gap-1">
            {index > 0 && <span className="text-muted">/</span>}
            {index < trail.length - 1 ? (
              <Link to={to} className="truncate text-muted hover:text-ink">{label}</Link>
            ) : (
              <span className="truncate font-semibold text-ink">{label}</span>
            )}
          </span>
        ))}
      </nav>
      <h1 className="min-w-0 truncate text-[13px] font-semibold text-ink md:hidden">{pageTitle}</h1>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <div className="relative hidden sm:block" ref={statusRef}>
          <button
            type="button"
            onClick={() => setStatusOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2 text-[12px] text-ink hover:bg-soft"
            aria-haspopup="menu"
            aria-expanded={statusOpen}
          >
            <span className={`h-2 w-2 rounded-full ${
              myStatus === 'online' ? 'bg-success' : myStatus === 'away' ? 'bg-warning' : myStatus === 'busy' ? 'bg-danger' : myStatus === 'in_meeting' ? 'bg-brand' : 'bg-line'
            }`} />
            {myStatus.replace('_', ' ')}
          </button>
          {statusOpen && (
            <div role="menu" className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-line bg-white py-1">
              {['online', 'away', 'busy', 'in_meeting'].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-[12px] capitalize hover:bg-soft"
                  onClick={() => {
                    setStatus(s);
                    api.put('/workspace/presence', { status: s }).catch(() => {});
                    setStatusOpen(false);
                  }}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
        <NotificationBell />

        <button
          type="button"
          onClick={handleLogout}
          className="ml-1 flex h-8 items-center gap-2 rounded border border-line pl-1 pr-2 hover:bg-soft"
          title="Sign out"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-brand text-[10px] font-semibold text-white">
            {initials}
          </span>
          <span className="hidden max-w-[120px] truncate text-[13px] text-ink lg:block">{adminName}</span>
          <FiChevronDown className="hidden h-3 w-3 text-muted lg:block" />
        </button>
      </div>
    </header>
  );
};

export default Header;
