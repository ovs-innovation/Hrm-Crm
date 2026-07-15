import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiMessageSquare, 
  FiUsers, 
  FiBriefcase, 
  FiClock, 
  FiDollarSign,
  FiFileText,
  FiTarget,
  FiBarChart2,
  FiChevronDown,
  FiChevronRight,
  FiX
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
            ${isOpen ? 'bg-blue-600/10 text-white font-semibold' : 'text-white hover:bg-slate-900'}
          `}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{title}</span>
          </div>
          {isOpen ? <FiChevronDown className="w-4 h-4 text-blue-450" /> : <FiChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="ml-6 pl-4 border-l border-slate-800 space-y-1">
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
        ${isActive 
          ? 'bg-blue-600/20 text-white font-bold border-l-4 border-blue-500 shadow-md shadow-blue-500/5' 
          : 'text-white hover:bg-slate-900'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 ${isActive ? 'text-blue-450' : 'text-slate-400'}`} />
          <span>{title}</span>
        </>
      )}
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
        ? 'text-white bg-blue-600/20 font-bold' 
        : 'text-slate-200 hover:text-white hover:bg-slate-900/50'
      }
    `}
  >
    {({ isActive }) => (
      <span className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-transparent'}`}></span>
        {title}
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 h-screen fixed top-0 left-0 overflow-y-auto border-r border-slate-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-450 to-indigo-400 flex items-center gap-2 tracking-tight">
            HRM Pro
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

      <nav className="p-4 flex-1 mt-2">
        <NavItem icon={FiHome} title="Dashboard" to="/" onClick={() => setIsOpen(false)} />
        <NavItem icon={FiMessageSquare} title="Messenger" to="/messenger" onClick={() => setIsOpen(false)} />
        
        <div className="mt-8 mb-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Management
        </div>

        <NavItem icon={FiUsers} title="HR">
          <SubNavItem title="Employees" to="/hrm/employees" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Leaves" to="/hrm/leaves" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Shift Roster" to="/hrm/shift-roster" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Attendance" to="/hrm/attendance" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Holiday" to="/hrm/holiday" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Tasks" to="/hrm/tasks" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Designation" to="/hrm/designation" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Department" to="/hrm/department" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Appreciation" to="/hrm/appreciation" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Daily Work Reports" to="/hrm/daily-reports" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Announcements" to="/hrm/announcements" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Payroll" to="/hrm/payroll" onClick={() => setIsOpen(false)} />
        </NavItem>

        <NavItem icon={FiBriefcase} title="CRM System" to="/crm" onClick={() => setIsOpen(false)} />
        <NavItem icon={FiTarget} title="Project System" to="/hrm/projects" onClick={() => setIsOpen(false)} />
        
        <div className="mt-8 mb-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Analysis
        </div>

        <NavItem icon={FiBarChart2} title="Reports">
          <SubNavItem title="Task Report" to="/reports/tasks" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Time Log Report" to="/reports/time-log" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Leave Report" to="/reports/leave" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Attendance Report" to="/reports/attendance" onClick={() => setIsOpen(false)} />
          <SubNavItem title="Finance Report" to="/reports/finance" onClick={() => setIsOpen(false)} />
        </NavItem>
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;
