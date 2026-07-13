import React, { useState } from 'react';
import { Card } from '../../components';
import { FiCheck, FiX, FiCalendar } from 'react-icons/fi';

const Timesheet = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  const attendanceData = [
    { id: 1, name: 'John Doe', date: 'Oct 24, 2026', status: 'Present', checkIn: '09:02 AM', checkOut: '05:30 PM', late: 'No' },
    { id: 2, name: 'Jane Smith', date: 'Oct 24, 2026', status: 'Present', checkIn: '08:55 AM', checkOut: '05:45 PM', late: 'No' },
    { id: 3, name: 'Michael Johnson', date: 'Oct 24, 2026', status: 'Late', checkIn: '09:35 AM', checkOut: '06:00 PM', late: 'Yes (35m)' },
    { id: 4, name: 'Emily Davis', date: 'Oct 24, 2026', status: 'Absent', checkIn: '--', checkOut: '--', late: 'No' },
  ];

  const leaveRequests = [
    { id: 1, employee: 'Emily Davis', leaveType: 'Sick Leave', startDate: 'Oct 25, 2026', endDate: 'Oct 27, 2026', days: 3, reason: 'Flu recovery', status: 'Pending' },
    { id: 2, employee: 'Robert Wilson', leaveType: 'Casual Leave', startDate: 'Oct 29, 2026', endDate: 'Oct 30, 2026', days: 2, reason: 'Family event', status: 'Approved' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Timesheet & Attendance</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage daily clock-ins, clock-outs, and leaves</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'attendance', label: 'Daily Attendance' },
          { id: 'leaves', label: 'Leave Requests' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all -mb-px
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <Card title="Attendance Record (Today)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Check In</th>
                  <th className="pb-3 font-semibold">Check Out</th>
                  <th className="pb-3 font-semibold">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{row.name}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{row.date}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${row.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          row.status === 'Late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-xs">{row.checkIn}</td>
                    <td className="py-4 font-mono text-xs">{row.checkOut}</td>
                    <td className="py-4 text-slate-500">{row.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'leaves' && (
        <Card title="Manage Leaves">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium text-slate-850 dark:text-slate-200">{req.employee}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{req.leaveType}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                      <div>{req.startDate} to {req.endDate}</div>
                      <div className="text-xs text-slate-400">{req.days} days</div>
                    </td>
                    <td className="py-4 text-slate-500">{req.reason}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${req.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {req.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded dark:hover:bg-green-950/30"><FiCheck className="w-5 h-5" /></button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-950/30"><FiX className="w-5 h-5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Timesheet;
