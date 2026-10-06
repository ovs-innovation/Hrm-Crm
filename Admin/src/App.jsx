import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CrmHome from './pages/crm/CrmHome';
import AIHub from './pages/crm/AIHub';
import Leads from './pages/crm/Leads';
import Contacts from './pages/crm/Contacts';
import Deals from './pages/crm/Deals';
import Documents from './pages/crm/Documents';
import Campaigns from './pages/crm/Campaigns';
import Meetings from './pages/crm/Meetings';
import Calls from './pages/crm/Calls';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import DepartmentList from './features/organization/components/DepartmentList';
import DesignationList from './features/organization/components/DesignationList';
import Reports from './pages/hrm/Reports';
import Attendance from './pages/hrm/Attendance';
import WfhBoard from './pages/hrm/WfhBoard';
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
import SetupWizard from './pages/auth/SetupWizard';
import AutomationBuilder from './pages/crm/AutomationBuilder';
import ReportBuilder from './pages/crm/ReportBuilder';
import Marketplace from './pages/crm/Marketplace';
import OrgChart from './pages/employees/OrgChart';
import AiCostDashboard from './pages/crm/AiCostDashboard';
import AIInbox from './pages/crm/AIInbox';
import KnowledgeBase from './pages/crm/KnowledgeBase';

const Workspace = lazy(() => import('./pages/workspace/Workspace'));

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
        <Route path="/setup-wizard" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          {/* CRM Home — Zoho-style onboarding */}
          <Route index element={<CrmHome />} />
          <Route path="ai" element={<AIHub />} />
          <Route path="ai-hub" element={<Navigate to="/ai" replace />} />
          <Route path="ai/knowledge" element={<KnowledgeBase />} />
          <Route path="ai/usage" element={<AiCostDashboard />} />

          {/* CRM — Sales */}
          <Route path="crm/leads" element={<Leads />} />
          <Route path="crm/contacts" element={<Contacts />} />
          <Route path="crm/accounts" element={<Clients />} />
          <Route path="crm/deals" element={<Deals />} />
          <Route path="crm/invoices" element={<Invoices />} />
          <Route path="crm/documents" element={<Documents />} />
          <Route path="crm/knowledge-base" element={<Navigate to="/ai/knowledge" replace />} />
          <Route path="crm/campaigns" element={<Campaigns />} />
          <Route path="crm/automation" element={<AutomationBuilder />} />
          <Route path="crm/reports" element={<Navigate to="/reports/builder" replace />} />
          <Route path="crm/marketplace" element={<Marketplace />} />
          <Route path="crm/ai-costs" element={<Navigate to="/ai/usage" replace />} />
          <Route path="crm/inbox" element={<AIInbox />} />

          {/* CRM — Activities */}
          <Route path="crm/tasks" element={<Navigate to="/work/tasks" replace />} />
          <Route path="crm/meetings" element={<Meetings />} />
          <Route path="crm/calls" element={<Calls />} />

          <Route path="reports/builder" element={<ReportBuilder />} />
          <Route path="reports/*" element={<Reports />} />
          <Route path="analytics" element={<Navigate to="/reports" replace />} />

          {/* HRM */}
          <Route path="hrm/employees/:id" element={<EmployeeProfile />} />
          <Route path="hrm/employees" element={<EmployeeList />} />
          <Route path="hrm/leaves" element={<Leaves />} />
          <Route path="hrm/shift-roster" element={<ShiftRoster />} />
          <Route path="hrm/attendance" element={<Attendance />} />
          <Route path="hrm/wfh" element={<WfhBoard />} />
          <Route path="hrm/holiday" element={<Holiday />} />
          <Route path="hrm/tasks" element={<Navigate to="/work/tasks" replace />} />
          <Route path="hrm/org-chart" element={<OrgChart />} />
          <Route path="hrm/designation" element={<DesignationList />} />
          <Route path="hrm/department" element={<DepartmentList />} />
          <Route path="hrm/daily-reports" element={<EmployeeReports />} />
          <Route path="hrm/appreciation" element={<Appreciation />} />
          <Route path="hrm/announcements" element={<AnnouncementsView />} />
          <Route path="hrm/projects" element={<Navigate to="/work/projects" replace />} />
          <Route path="hrm/payroll" element={<Payroll />} />
          <Route path="hrm/payroll/invoice/:id" element={<PayslipDetail />} />
          <Route path="hrm/tickets" element={<Navigate to="/support/tickets" replace />} />
          <Route path="hrm/recruitment" element={<Recruitment />} />

          <Route path="work/projects" element={<Projects />} />
          <Route path="work/tasks/:id" element={<Tasks />} />
          <Route path="work/tasks" element={<Tasks />} />
          <Route path="support/tickets" element={<Tickets />} />
          <Route path="workspace" element={<Suspense fallback={<div className="p-6 text-[13px] text-muted">Loading workspace…</div>}><Workspace /></Suspense>} />
          <Route path="messenger" element={<Navigate to="/workspace" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="crm" element={<Navigate to="/crm/accounts" replace />} />
          <Route path="projects" element={<Navigate to="/work/projects" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
