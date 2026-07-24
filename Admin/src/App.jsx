import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CrmHome from './pages/crm/CrmHome';
import Leads from './pages/crm/Leads';
import Contacts from './pages/crm/Contacts';
import Deals from './pages/crm/Deals';
import Documents from './pages/crm/Documents';
import Campaigns from './pages/crm/Campaigns';
import Meetings from './pages/crm/Meetings';
import Calls from './pages/crm/Calls';
import EmployeeList from './pages/employees/EmployeeList';
import DepartmentList from './features/organization/components/DepartmentList';
import DesignationList from './features/organization/components/DesignationList';
import Reports from './pages/hrm/Reports';
import Analytics from './pages/analytics/Analytics';
import Messenger from './pages/Messenger';
import Attendance from './pages/hrm/Attendance';
import Clients from './pages/crm/Clients';
import Projects from './pages/crm/Projects';
import Leaves from './pages/hrm/Leaves';
import Holiday from './pages/hrm/Holiday';
import Tasks from './pages/hrm/Tasks';
import AnnouncementsView from './pages/hrm/AnnouncementsView';
import EmployeeReports from './pages/hrm/EmployeeReports';
import ShiftRoster from './pages/hrm/ShiftRoster';
import Appreciation from './pages/hrm/Appreciation';
import Payroll from './pages/hrm/Payroll';
import PayslipDetail from './pages/hrm/PayslipDetail';
import Tickets from './pages/hrm/Tickets';
import Recruitment from './pages/hrm/Recruitment';
import Settings from './pages/settings/Settings';
import Invoices from './pages/crm/Invoices';
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
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }} 
      />
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          {/* CRM Home — Zoho-style onboarding */}
          <Route index element={<CrmHome />} />

          {/* CRM — Sales */}
          <Route path="crm/leads" element={<Leads />} />
          <Route path="crm/contacts" element={<Contacts />} />
          <Route path="crm/accounts" element={<Clients />} />
          <Route path="crm/deals" element={<Deals />} />
          <Route path="crm/invoices" element={<Invoices />} />
          <Route path="crm/documents" element={<Documents />} />
          <Route path="crm/campaigns" element={<Campaigns />} />

          {/* CRM — Activities */}
          <Route path="crm/tasks" element={<Tasks />} />
          <Route path="crm/meetings" element={<Meetings />} />
          <Route path="crm/calls" element={<Calls />} />

          <Route path="reports/*" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />

          {/* HRM */}
          <Route path="hrm/employees" element={<EmployeeList />} />
          <Route path="hrm/leaves" element={<Leaves />} />
          <Route path="hrm/shift-roster" element={<ShiftRoster />} />
          <Route path="hrm/attendance" element={<Attendance />} />
          <Route path="hrm/holiday" element={<Holiday />} />
          <Route path="hrm/tasks" element={<Tasks />} />
          <Route path="hrm/designation" element={<DesignationList />} />
          <Route path="hrm/department" element={<DepartmentList />} />
          <Route path="hrm/daily-reports" element={<EmployeeReports />} />
          <Route path="hrm/appreciation" element={<Appreciation />} />
          <Route path="hrm/announcements" element={<AnnouncementsView />} />
          <Route path="hrm/projects" element={<Projects />} />
          <Route path="hrm/payroll" element={<Payroll />} />
          <Route path="hrm/payroll/invoice/:id" element={<PayslipDetail />} />
          <Route path="hrm/tickets" element={<Tickets />} />
          <Route path="hrm/recruitment" element={<Recruitment />} />

          <Route path="messenger" element={<Messenger />} />
          <Route path="settings" element={<Settings />} />
          <Route path="crm" element={<Navigate to="/crm/accounts" replace />} />
          <Route path="projects" element={<Projects />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
