import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import VastoraLogo from '../components/VastoraLogo';
import api from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  FiHome,
  FiCalendar,
  FiCheckSquare,
  FiFileText,
  FiMessageSquare,
  FiUser,
  FiLogOut,
  FiX,
  FiUsers,
  FiBell,
  FiAward,
  FiClock,
  FiDollarSign,
  FiLifeBuoy,
  FiBriefcase,
} from 'react-icons/fi';

const NavItem = ({ to, icon: Icon, title, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors ${
        isActive ? 'bg-brand-xlight font-medium text-brand' : 'text-ink/70 hover:bg-soft hover:text-ink'
      }`
    }
  >
    <Icon className="h-[15px] w-[15px] shrink-0 opacity-80" strokeWidth={1.75} />
    <span className="truncate">{title}</span>
  </NavLink>
);

const Section = ({ title, children }) => (
  <div className="pt-4">
    <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user || {});
  const role = (user.role || '').toLowerCase().trim();
  const isManager = role === 'hr' || role === 'manager';

  const handleLogout = async () => {
    try {
      await api.post('/employees/logout', {});
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={() => setIsOpen(false)} aria-hidden />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col border-r border-line bg-surface transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-line px-3">
          <div>
            <VastoraLogo className="h-8 w-auto max-w-[150px] object-contain" />
            <p className="text-[10px] font-medium text-muted">Employee Portal</p>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1 text-muted hover:bg-soft md:hidden" aria-label="Close">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            <NavItem to="/" icon={FiHome} title="Dashboard" end onClick={() => setIsOpen(false)} />
            <NavItem to="/attendance" icon={FiCalendar} title="Attendance" onClick={() => setIsOpen(false)} />
            <NavItem to="/leaves" icon={FiCalendar} title="Leave" onClick={() => setIsOpen(false)} />
            <NavItem to="/tasks" icon={FiCheckSquare} title="My tasks" onClick={() => setIsOpen(false)} />
            <NavItem to="/daily-reports" icon={FiFileText} title="Daily report" onClick={() => setIsOpen(false)} />
            <NavItem to="/messenger" icon={FiMessageSquare} title="Messages" onClick={() => setIsOpen(false)} />
            <NavItem to="/policies" icon={FiBell} title="Announcements" onClick={() => setIsOpen(false)} />
            <NavItem to="/payslips" icon={FiDollarSign} title="Payslips" onClick={() => setIsOpen(false)} />
            <NavItem to="/appreciation" icon={FiAward} title="Recognition" onClick={() => setIsOpen(false)} />
            <NavItem to="/roster" icon={FiClock} title="My shifts" onClick={() => setIsOpen(false)} />
            <NavItem to="/tickets" icon={FiLifeBuoy} title="Support" onClick={() => setIsOpen(false)} />
            <NavItem to="/careers" icon={FiBriefcase} title="Careers" onClick={() => setIsOpen(false)} />
            <NavItem to="/profile" icon={FiUser} title="Profile" onClick={() => setIsOpen(false)} />
          </div>

          {isManager && (
            <Section title="Team management">
              <NavItem to="/manage/employees" icon={FiUsers} title="Employees" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/leaves" icon={FiCalendar} title="Leave approvals" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/attendance" icon={FiCalendar} title="Team attendance" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/tasks" icon={FiCheckSquare} title="Assign tasks" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/holidays" icon={FiCalendar} title="Holidays" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/announcements" icon={FiBell} title="Broadcast" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/appreciation" icon={FiAward} title="Appreciation" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/roster" icon={FiClock} title="Shift roster" onClick={() => setIsOpen(false)} />
              <NavItem to="/manage/reports" icon={FiFileText} title="Daily reports" onClick={() => setIsOpen(false)} />
            </Section>
          )}
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-full items-center gap-2 rounded px-2.5 text-[13px] text-muted hover:bg-soft hover:text-ink"
          >
            <FiLogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
