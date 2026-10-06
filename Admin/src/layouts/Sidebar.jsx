import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import VastoraLogo from '../components/VastoraLogo';
import { getNavAccess } from '../utils/roleAccess';
import {
  FiHome,
  FiBarChart2,
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
  FiAward,
  FiClock,
  FiLifeBuoy,
  FiSettings,
  FiFileText,
  FiCpu,
  FiBook,
  FiHash,
  FiPieChart,
} from 'react-icons/fi';

const SECTIONS = [
  {
    id: 'crm',
    title: 'CRM',
    access: 'crm',
    items: [
      { title: 'Leads', to: '/crm/leads', icon: FiTarget },
      { title: 'Contacts', to: '/crm/contacts', icon: FiUser },
      { title: 'Accounts', to: '/crm/accounts', icon: FiBriefcase },
      { title: 'Deals', to: '/crm/deals', icon: FiDollarSign },
      {
        title: 'Sales',
        children: [
          { title: 'Quotes & Invoices', to: '/crm/invoices', icon: FiFileText },
          { title: 'Meetings', to: '/crm/meetings', icon: FiCalendar },
          { title: 'Calls', to: '/crm/calls', icon: FiPhone },
          { title: 'Campaigns', to: '/crm/campaigns', icon: FiRadio },
          { title: 'Documents', to: '/crm/documents', icon: FiFolder },
        ],
      },
    ],
  },
  {
    id: 'hrms',
    title: 'HRMS',
    access: 'hrms',
    items: [
      { title: 'Employees', to: '/hrm/employees', icon: FiUsers },
      { title: 'Attendance', to: '/hrm/attendance', icon: FiClock },
      { title: 'Work from home', to: '/hrm/wfh', icon: FiHome },
      { title: 'Leave', to: '/hrm/leaves', icon: FiCalendar },
      { title: 'Payroll', to: '/hrm/payroll', icon: FiDollarSign },
      { title: 'Recruitment', to: '/hrm/recruitment', icon: FiTarget },
      {
        title: 'Organization',
        children: [
          { title: 'Departments', to: '/hrm/department', icon: FiBriefcase },
          { title: 'Designations', to: '/hrm/designation', icon: FiAward },
          { title: 'Org chart', to: '/hrm/org-chart', icon: FiUsers },
          { title: 'Shift roster', to: '/hrm/shift-roster', icon: FiClock },
          { title: 'Holidays', to: '/hrm/holiday', icon: FiCalendar },
        ],
      },
      {
        title: 'Announcements',
        children: [
          { title: 'Announcements', to: '/hrm/announcements', icon: FiRadio },
          { title: 'Appreciation', to: '/hrm/appreciation', icon: FiAward },
          { title: 'Daily reports', to: '/hrm/daily-reports', icon: FiFolder },
        ],
      },
    ],
  },
  {
    id: 'work',
    title: 'Work',
    access: 'work',
    items: [
      { title: 'Projects', to: '/work/projects', icon: FiBriefcase },
      { title: 'Tasks', to: '/work/tasks', icon: FiCheckSquare },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    access: 'workspace',
    items: [{ title: 'Channels', to: '/workspace', icon: FiHash }],
  },
  {
    id: 'support',
    title: 'Support',
    access: 'support',
    items: [{ title: 'Tickets', to: '/support/tickets', icon: FiLifeBuoy }],
  },
  {
    id: 'ai',
    title: 'AI',
    access: 'ai',
    items: [
      { title: 'Copilot', to: '/ai', icon: FiCpu },
      { title: 'Knowledge base', to: '/ai/knowledge', icon: FiBook },
      { title: 'Usage', to: '/ai/usage', icon: FiPieChart },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    access: 'reports',
    items: [
      { title: 'CRM', to: '/reports?report=sales-overview', icon: FiBarChart2 },
      { title: 'HR', to: '/reports?report=attendance', icon: FiUsers },
      { title: 'Work', to: '/reports?report=tasks', icon: FiCheckSquare },
      { title: 'Finance', to: '/reports?report=payroll', icon: FiDollarSign },
      { title: 'Builder', to: '/reports/builder', icon: FiFileText },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    access: 'administration',
    items: [
      { title: 'Company', to: '/settings', icon: FiBriefcase },
      { title: 'Audit', to: '/settings#audit', icon: FiFileText },
      { title: 'Setup', to: '/setup-wizard', icon: FiSettings },
    ],
  },
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

const Section = ({ title, children, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!children || React.Children.count(children) === 0) return null;
  return (
    <div className="pt-3">
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
  const location = useLocation();
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const access = getNavAccess(adminInfo.role);
  const close = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={close} aria-hidden />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-line bg-surface transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-line px-3">
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

        {adminInfo.role && (
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-[11px] text-muted">Signed in as</p>
            <p className="truncate text-[12px] font-medium text-ink">{adminInfo.name}</p>
            <span className="mt-1 inline-block rounded bg-brand-xlight px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
              {adminInfo.role}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {access.dashboard && (
            <NavItem to="/" icon={FiHome} title="Dashboard" end onClick={close} />
          )}

          {SECTIONS.filter((section) => access[section.access]).map((section) => (
            <Section
              key={section.id}
              title={section.title}
              defaultOpen={section.items.some((item) =>
                item.to ? location.pathname.startsWith(item.to.split('?')[0]) : item.children?.some((child) => location.pathname.startsWith(child.to.split('?')[0]))
              )}
            >
              {section.items.map((item) =>
                item.children ? (
                  <Section
                    key={item.title}
                    title={item.title}
                    defaultOpen={item.children.some((child) => location.pathname.startsWith(child.to.split('?')[0]))}
                  >
                    {item.children.map((child) => (
                      <NavItem key={child.to} {...child} onClick={close} />
                    ))}
                  </Section>
                ) : (
                  <NavItem key={item.to} {...item} onClick={close} />
                )
              )}
            </Section>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
