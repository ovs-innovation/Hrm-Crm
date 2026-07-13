import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import CoreHR from './pages/hrm/CoreHR';
import Performance from './pages/hrm/Performance';
import Timesheet from './pages/hrm/Timesheet';
import Finance from './pages/hrm/Finance';
import Payroll from './pages/hrm/Payroll';
import PayslipInvoice from './pages/hrm/PayslipInvoice';
import Recruitment from './pages/hrm/Recruitment';
import Reports from './pages/hrm/Reports';
import Messenger from './pages/Messenger';
import Attendance from './pages/hrm/Attendance';
import Department from './pages/hrm/Department';
import Designation from './pages/hrm/Designation';
import Clients from './pages/crm/Clients';
import Projects from './pages/crm/Projects';
import Leaves from './pages/hrm/Leaves';
import Holiday from './pages/hrm/Holiday';
import Appreciation from './pages/hrm/Appreciation';
import ShiftRoster from './pages/hrm/ShiftRoster';
import Tasks from './pages/hrm/Tasks';
import AnnouncementsView from './pages/hrm/AnnouncementsView';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            background: '#1e293b', // slate-800
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e', // rose-500
              secondary: '#fff',
            },
          },
        }} 
      />
      <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          {/* HRM System Routes */}
          <Route path="hrm">
            <Route path="employees" element={<EmployeeList />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="shift-roster" element={<ShiftRoster />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="holiday" element={<Holiday />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="recruitment" element={<div className="p-8 text-white"><h2 className="text-xl font-bold">Recruitment</h2><p className="text-slate-400 mt-2">Module coming soon.</p></div>} />
            <Route path="designation" element={<Designation />} />
            <Route path="department" element={<Department />} />
            <Route path="appreciation" element={<Appreciation />} />
            <Route path="announcements" element={<AnnouncementsView />} />
            <Route path="projects" element={<Projects />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="payroll/invoice/:id" element={<PayslipInvoice />} />
          </Route>

          {/* Other Systems */}
          <Route path="messenger" element={<Messenger />} />
          <Route path="crm" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="reports/*" element={<Reports />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
