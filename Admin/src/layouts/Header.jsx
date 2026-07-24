import React from 'react';
import { FiMenu, FiPlus, FiChevronDown } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';

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
  '/crm/tasks': 'Tasks',
  '/crm/meetings': 'Meetings',
  '/crm/calls': 'Calls',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/messenger': 'Messenger',
  '/hrm/employees': 'Employees',
  '/settings': 'Settings',
};

const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const adminName = adminInfo.name || 'User';
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const pageTitle =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/hrm') ? 'HRM' : 'Vastora CRM');

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

      <h1 className="min-w-0 truncate text-[13px] font-semibold text-ink">{pageTitle}</h1>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className="hidden h-8 items-center gap-1.5 rounded border border-brand bg-brand px-2.5 text-[13px] font-medium text-ink hover:bg-brand-hover sm:inline-flex"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Create
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-muted hover:bg-soft hover:text-ink sm:hidden"
          aria-label="Create"
        >
          <FiPlus className="h-[18px] w-[18px]" />
        </button>
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
