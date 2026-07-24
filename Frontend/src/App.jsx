import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Messenger from './pages/Messenger';
import SetPassword from './pages/auth/SetPassword';
import Login from './pages/auth/Login';
import DailyReports from './pages/DailyReports';

// Management Pages
import ManageEmployees from './pages/ManageEmployees';
import ManageAttendance from './pages/ManageAttendance';
import ManageLeaves from './pages/ManageLeaves';
import ManageTasks from './pages/ManageTasks';
import ManageHolidays from './pages/ManageHolidays';
import ManageAnnouncements from './pages/ManageAnnouncements';
import ManageProjects from './pages/ManageProjects';
import ManageReports from './pages/ManageReports';
import Profile from './pages/Profile';
import Policies from './pages/Policies';
import Payslips from './pages/Payslips';
import Tickets from './pages/Tickets';
import Careers from './pages/Careers';
import Appreciation from './pages/Appreciation';
import ShiftRoster from './pages/ShiftRoster';
import ManageAppreciation from './pages/ManageAppreciation';
import ManageShiftRoster from './pages/ManageShiftRoster';

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

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
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Private Employee Dashboard Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="daily-reports" element={<DailyReports />} />
          <Route path="messenger" element={<Messenger />} />
          <Route path="policies" element={<Policies />} />
          <Route path="profile" element={<Profile />} />
          <Route path="payslips" element={<Payslips />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="careers" element={<Careers />} />
          <Route path="appreciation" element={<Appreciation />} />
          <Route path="roster" element={<ShiftRoster />} />

          <Route path="manage/employees" element={<ManageEmployees />} />
          <Route path="manage/attendance" element={<ManageAttendance />} />
          <Route path="manage/leaves" element={<ManageLeaves />} />
          <Route path="manage/tasks" element={<ManageTasks />} />
          <Route path="manage/holidays" element={<ManageHolidays />} />
          <Route path="manage/announcements" element={<ManageAnnouncements />} />
          <Route path="manage/appreciation" element={<ManageAppreciation />} />
          <Route path="manage/roster" element={<ManageShiftRoster />} />
          <Route path="manage/projects" element={<ManageProjects />} />
          <Route path="manage/reports" element={<ManageReports />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
