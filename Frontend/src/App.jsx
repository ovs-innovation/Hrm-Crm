import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import LeaveCalendar from './pages/LeaveCalendar';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Messenger from './pages/Messenger';
import SetPassword from './pages/auth/SetPassword';
import Login from './pages/auth/Login';
import Payslips from './pages/Payslips';

// Management Pages
import ManageEmployees from './pages/ManageEmployees';
import ManageAttendance from './pages/ManageAttendance';
import ManageLeaves from './pages/ManageLeaves';
import ManageTasks from './pages/ManageTasks';
import ManageHolidays from './pages/ManageHolidays';
import ManageAnnouncements from './pages/ManageAnnouncements';
import ManageAppreciation from './pages/ManageAppreciation';
import ManageShiftRoster from './pages/ManageShiftRoster';
import ManageProjects from './pages/ManageProjects';

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
          
          {/* Employee Routes */}
          <Route path="attendance" element={<Attendance />} />
          <Route path="messenger" element={<Messenger />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="leaves" element={<LeaveCalendar />} />
          <Route path="payslips" element={<Payslips />} />
          <Route path="policies" element={<div className="p-8">Company Policies (Coming Soon)</div>} />
          <Route path="profile" element={<div className="p-8">My Profile (Coming Soon)</div>} />

          {/* Management Routes */}
          <Route path="manage/employees" element={<ManageEmployees />} />
          <Route path="manage/attendance" element={<ManageAttendance />} />
          <Route path="manage/leaves" element={<ManageLeaves />} />
          <Route path="manage/tasks" element={<ManageTasks />} />
          <Route path="manage/holidays" element={<ManageHolidays />} />
          <Route path="manage/announcements" element={<ManageAnnouncements />} />
          <Route path="manage/appreciation" element={<ManageAppreciation />} />
          <Route path="manage/roster" element={<ManageShiftRoster />} />
          <Route path="manage/projects" element={<ManageProjects />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
