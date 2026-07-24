import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import VastoraLogo from '../components/VastoraLogo';
import { getNavAccess } from '../utils/roleAccess';
import {
  FiHome,
  FiBarChart2,
  FiPieChart,
  FiChevronDown,
  FiChevronRight,
  FiX,
  FiTarget,
  FiUser,
  FiBriefcase,
  FiDollarSign,
  FiFolder,
  FiRadio,
  FiCheckSquare,
  FiCalendar,
  FiPhone,
  FiUsers,
  FiMessageSquare,
  FiAward,
  FiClock,
  FiLifeBuoy,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';

const SALES = [
  { title: 'Leads', to: '/crm/leads', icon: FiTarget },
  { title: 'Contacts', to: '/crm/contacts', icon: FiUser },
  { title: 'Accounts', to: '/crm/accounts', icon: FiBriefcase },
  { title: 'Deals', to: '/crm/deals', icon: FiDollarSign },
  { title: 'Quotes & Invoices', to: '/crm/invoices', icon: FiFileText },
  { title: 'Documents', to: '/crm/documents', icon: FiFolder },
  { title: 'Campaigns', to: '/crm/campaigns', icon: FiRadio },
];

const ACTIVITIES = [
  { title: 'Tasks', to: '/crm/tasks', icon: FiCheckSquare },
  { title: 'Meetings', to: '/crm/meetings', icon: FiCalendar },
  { title: 'Calls', to: '/crm/calls', icon: FiPhone },
];

const PEOPLE = [
  { title: 'Employees', to: '/hrm/employees', icon: FiUsers },
  { title: 'Departments', to: '/hrm/department', icon: FiBriefcase },
  { title: 'Designations', to: '/hrm/designation', icon: FiAward },
  { title: 'Leaves', to: '/hrm/leaves', icon: FiCalendar },
  { title: 'Attendance', to: '/hrm/attendance', icon: FiCalendar },
  { title: 'Shift roster', to: '/hrm/shift-roster', icon: FiClock },
  { title: 'Holidays', to: '/hrm/holiday', icon: FiCalendar },
  { title: 'Payroll', to: '/hrm/payroll', icon: FiDollarSign },
  { title: 'Appreciation', to: '/hrm/appreciation', icon: FiAward },
  { title: 'Support tickets', to: '/hrm/tickets', icon: FiLifeBuoy },
  { title: 'Recruitment', to: '/hrm/recruitment', icon: FiTarget },
  { title: 'Announcements', to: '/hrm/announcements', icon: FiRadio },
  { title: 'Daily reports', to: '/hrm/daily-reports', icon: FiFolder },
  { title: 'Projects', to: '/hrm/projects', icon: FiBriefcase },
];

const NavItem = ({ to, icon: Icon, title, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors ${
        isActive
          ? 'bg-brand-xlight font-medium text-brand'
          : 'text-ink/70 hover:bg-soft hover:text-ink'
      }`
    }
  >
    <Icon className="h-[15px] w-[15px] shrink-0 opacity-80" strokeWidth={1.75} />
    <span className="truncate">{title}</span>
  </NavLink>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!children || React.Children.count(children) === 0) return null;
  return (
    <div className="pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-1 flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted"
      >
        {title}
        {open ? <FiChevronDown className="h-3 w-3" /> : <FiChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const access = getNavAccess(adminInfo.role);
  const close = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 md:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-line bg-surface transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-line px-3">
          <VastoraLogo className="h-8 w-auto max-w-[150px] object-contain" />
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-muted hover:bg-soft hover:text-ink md:hidden"
            aria-label="Close menu"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {adminInfo.role && (
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-[11px] text-muted">Signed in as</p>
            <p className="truncate text-[12px] font-medium text-ink">{adminInfo.name}</p>
            <span className="mt-1 inline-block rounded bg-brand-xlight px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
              {adminInfo.role}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {access.home && <NavItem to="/" icon={FiHome} title="Home" end onClick={close} />}
            {access.reports && <NavItem to="/reports" icon={FiBarChart2} title="Reports" end onClick={close} />}
            {access.analytics && <NavItem to="/analytics" icon={FiPieChart} title="Analytics" end onClick={close} />}
            {access.settings && <NavItem to="/settings" icon={FiSettings} title="Settings" end onClick={close} />}
          </div>

          {access.sales && (
            <Section title="Sales">
              {SALES.map((item) => (
                <NavItem key={item.to} {...item} onClick={close} />
              ))}
            </Section>
          )}

          {access.activities && (
            <Section title="Activities">
              {ACTIVITIES.map((item) => (
                <NavItem key={item.to} {...item} onClick={close} />
              ))}
            </Section>
          )}

          {access.people && (
            <Section title="People">
              {PEOPLE.map((item) => (
                <NavItem key={item.to} {...item} onClick={close} />
              ))}
              {access.messenger && (
                <NavItem to="/messenger" icon={FiMessageSquare} title="Messenger" onClick={close} />
              )}
            </Section>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
