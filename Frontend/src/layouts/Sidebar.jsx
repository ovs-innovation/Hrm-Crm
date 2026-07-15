import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { 
  FiHome, 
  FiClock, 
  FiCalendar, 
  FiDollarSign,
  FiFileText,
  FiUser,
  FiCheckSquare,
  FiMessageSquare,
  FiLogOut,
  FiX,
  FiUsers,
  FiActivity,
  FiBriefcase,
  FiTarget,
  FiChevronDown,
  FiChevronRight,
  FiPocket,
  FiHeadphones
} from 'react-icons/fi';

const NavItem = ({ icon: Icon, title, to, children, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(children);

  if (hasChildren) {
    return (
      <div className="mb-2">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isOpen ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-slate-800/60'}
          `}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-300'}`} />
            <span>{title}</span>
          </div>
          {isOpen ? <FiChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <FiChevronRight className="w-4 h-4 text-slate-400" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="ml-6 pl-4 border-l border-slate-200 dark:border-slate-800 space-y-1">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink 
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-3 mb-2 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold' : 'text-slate-650 hover:bg-slate-100 hover:text-slate-955 dark:text-white dark:hover:bg-slate-800'}
      `}
    >
      <Icon className="w-5 h-5 text-slate-400 dark:text-slate-300" />
      <span>{title}</span>
    </NavLink>
  );
};

const SubNavItem = ({ title, to, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      block px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${isActive 
        ? 'text-blue-600 bg-blue-600/10 dark:text-blue-400 dark:bg-blue-500/20 font-semibold' 
        : 'text-slate-550 hover:text-slate-955 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800/50'
      }
    `}
  >
    {({ isActive }) => (
      <span className="flex items-center gap-2 truncate">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'}`}></span>
        <span className="truncate">{title}</span>
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user || {});
  const userRole = (user.role || '').toLowerCase().trim();
  const isHR = userRole === 'hr';
  const isManager = userRole === 'manager';

  const handleLogout = async () => {
    try {
      await api.post('/employees/logout', {});
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: clear local storage even if API fails
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-slate-900 h-screen fixed top-0 left-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 shadow-sm z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2 tracking-tight">
            Employee Portal
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

      <nav className="p-4 flex-1 mt-4">
        <div className="mb-2 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        <NavItem icon={FiHome} title="Dashboard" to="/" onClick={() => setIsOpen(false)} />
        <NavItem icon={FiCalendar} title="My Calendar" to="/attendance" onClick={() => setIsOpen(false)} />
        <NavItem icon={FiUsers} title="Leads" to="/leads" onClick={() => setIsOpen(false)} />
        
        {isHR || isManager ? (
          <NavItem icon={FiUsers} title="HR">
            <SubNavItem title="Employees" to="/manage/employees" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Leaves" to="/manage/leaves" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Shift Roster" to="/manage/roster" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Attendance" to="/manage/attendance" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Holiday" to="/manage/holidays" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Tasks" to="/manage/tasks" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Designation" to="/designations" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Department" to="/departments" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Appreciation" to="/manage/appreciation" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Employee Reports" to="/manage/reports" onClick={() => setIsOpen(false)} />
            <SubNavItem title="Announcements" to="/manage/announcements" onClick={() => setIsOpen(false)} />
          </NavItem>
        ) : (
          <>
            <NavItem icon={FiFileText} title="Daily Reports" to="/daily-reports" onClick={() => setIsOpen(false)} />
            <NavItem icon={FiFileText} title="My Leave Requests" to="/leaves" onClick={() => setIsOpen(false)} />
            <NavItem icon={FiFileText} title="Company Policies" to="/policies" onClick={() => setIsOpen(false)} />
          </>
        )}

        <NavItem icon={FiBriefcase} title="Work">
          <SubNavItem title="My Tasks" to="/tasks" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Projects" to="/manage/projects" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Daily Reports" to="/daily-reports" onClick={() => setIsOpen(false)} />
        </NavItem>

        <NavItem icon={FiDollarSign} title="Finance">
          <SubNavItem title="My Payslips" to="/payslips" onClick={() => setIsOpen(false)} />
        </NavItem>

        <NavItem icon={FiHeadphones} title="Tickets" to="/tickets" onClick={() => setIsOpen(false)} />
        <NavItem icon={FiCalendar} title="Events" to="/events" onClick={() => setIsOpen(false)} />
        
        <NavItem icon={FiMessageSquare} title="Messages" to="/messenger" onClick={() => setIsOpen(false)} />
        {!(isHR || isManager) && (
          <NavItem icon={FiFileText} title="Notice Board" to="/manage/announcements" onClick={() => setIsOpen(false)} />
        )}
        
        <NavItem icon={FiPocket} title="Recruit">
          <SubNavItem title="Careers" to="/careers" onClick={() => setIsOpen(false)} />
        </NavItem>
        
        <NavItem icon={FiUser} title="Settings" to="/profile" onClick={() => setIsOpen(false)} />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-all duration-200"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
