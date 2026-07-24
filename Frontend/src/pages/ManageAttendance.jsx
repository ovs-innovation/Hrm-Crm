import React, { useState } from 'react';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiDownload, FiList, FiGrid } from 'react-icons/fi';
import api from '../services/api';
import EmployeeCalendarView from './EmployeeCalendarView';

const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut || checkIn.includes('--') || checkOut.includes('--')) return '--';

  const parseTime = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return new Date(2000, 0, 1, hours, minutes, 0);
  };

  const inTime = parseTime(checkIn);
  const outTime = parseTime(checkOut);

  let diff = (outTime - inTime) / 1000;
  if (diff < 0) return '--'; // Error case

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, bgGlow }) => (
  <div className="app-card p-6 rounded-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40 ${bgGlow}`}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-muted text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight mb-2">{value}</h3>
        <p className="text-muted text-xs">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-surface border border-line ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Default to current month YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'

  React.useEffect(() => {
    // Fetch all employees to populate dropdown
    api.get('/employees')
      .then(res => {
        setEmployees(res.data);
        if (res.data.length > 0) {
          setSelectedEmployee(res.data[0]._id || res.data[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  React.useEffect(() => {
    if (selectedEmployee && selectedMonth) {
      setLoading(true);
      api.get(`/attendance?employeeId=${selectedEmployee}&month=${selectedMonth}`)
        .then(res => setAttendanceRecords(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedEmployee, selectedMonth]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return 'bg-brand/20 text-brand border border-brand/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'Late': return 'bg-brand/20 text-brand border border-brand/25 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'Absent': return 'bg-brand/15 text-brand border border-rose-500/30 shadow-[0_0_10px_rgba(225,29,72,0.2)]';
      case 'Active': return 'bg-brand/20 text-brand border border-brand/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-pulse';
      default: return 'bg-white/30/20 text-muted border border-slate-500/30';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-ink tracking-tight flex items-center gap-3">
            Employee Attendance
          </h1>
          <p className="text-muted mt-1">Monitor daily check-ins, check-outs, and work hours.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-white/10 border border-line rounded-xl text-muted hover:text-white transition-all">
            <FiDownload className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Days" value={attendanceRecords.length.toString()} subtitle="Recorded this month" icon={FiCalendar} colorClass="text-brand" bgGlow="bg-brand" />
        <StatCard title="Present / Active" value={attendanceRecords.filter(r => r.status.includes('Present') || r.status.includes('Completed')).length.toString()} subtitle="Days present" icon={FiCheckCircle} colorClass="text-brand" bgGlow="bg-brand" />
        <StatCard title="Late Arrivals" value={attendanceRecords.filter(r => r.status.includes('Late')).length.toString()} subtitle="Arrived after 10:00 AM" icon={FiAlertCircle} colorClass="text-brand" bgGlow="bg-brand" />
        <StatCard title="Absent" value={attendanceRecords.filter(r => r.status === 'Absent').length.toString()} subtitle="On leave or unnotified" icon={FiXCircle} colorClass="text-brand" bgGlow="bg-brand" />
      </div>

      {/* Main Content / Table */}
      <div className="app-panel rounded-3xl overflow-hidden border border-line">

        {/* Table Toolbar */}
        <div className="p-6 border-b border-line flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface/30">
          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="appearance-none w-full bg-ink/30 border border-line text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all cursor-pointer"
            >
              <option value="" disabled>Select an Employee</option>
              {employees.map(emp => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.name} ({emp.position || 'Employee'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">

            {/* View Toggle */}
            <div className="flex bg-ink/30 rounded-xl p-1 border border-line">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-brand text-white shadow-md' : 'text-muted hover:text-white'}`}
                title="Table View"
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-brand text-white shadow-md' : 'text-muted hover:text-white'}`}
                title="Calendar View"
              >
                <FiGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-ink/30 border border-line text-muted rounded-xl py-2 px-4 focus:outline-none focus:border-slate-600 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-navy/40 text-sm text-muted uppercase tracking-wider">
                  <th className="p-5 font-semibold">Date</th>
                  <th className="p-5 font-semibold">Check In</th>
                  <th className="p-5 font-semibold">Check Out</th>
                  <th className="p-5 font-semibold">Work Hours</th>
                  <th className="p-5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted">
                      Loading attendance data...
                    </td>
                  </tr>
                ) : attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-surface/40 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="text-white font-medium">{record.date}</h4>
                          <p className="text-xs text-muted">{record.workMode || 'Office'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-muted font-medium">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-muted w-4 h-4" />
                        {record.checkIn || '--:-- --'}
                      </div>
                    </td>
                    <td className="p-5 text-muted font-medium">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-muted w-4 h-4" />
                        {record.checkOut || '--:-- --'}
                      </div>
                    </td>
                    <td className="p-5 text-muted font-mono">
                      {calculateWorkHours(record.checkIn, record.checkOut)}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted">
                      No attendance records found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-soft">
            {selectedEmployee ? (
              <EmployeeCalendarView employeeId={selectedEmployee} monthStr={selectedMonth} />
            ) : (
              <div className="text-center p-10 text-muted">Please select an employee to view their calendar.</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Attendance;
