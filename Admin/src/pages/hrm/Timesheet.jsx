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
        <h2 className="text-[15px] font-semibold text-ink">Timesheet & Attendance</h2>
        <p className="text-muted text-muted text-sm">Manage daily clock-ins, clock-outs, and leaves</p>
      </div>

      <div className="flex border-b border-line">
        {[
          { id: 'attendance', label: 'Daily Attendance' },
          { id: 'leaves', label: 'Leave Requests' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all -mb-px
              ${activeTab === tab.id 
                ? 'border-brand text-brand border-brand text-brand' 
                : 'border-transparent text-muted hover:text-ink'}`}
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
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Check In</th>
                  <th className="pb-3 font-semibold">Check Out</th>
                  <th className="pb-3 font-semibold">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {attendanceData.map((row) => (
                  <tr key={row.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{row.name}</td>
                    <td className="py-4 text-muted text-muted">{row.date}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${row.status === 'Present' ? 'bg-brand/10 text-brand bg-brand/10' : 
                          row.status === 'Late' ? 'bg-brand/10 text-brand bg-brand/10' : 
                          'bg-brand/10 text-brand bg-brand/10'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-xs">{row.checkIn}</td>
                    <td className="py-4 font-mono text-xs">{row.checkOut}</td>
                    <td className="py-4 text-muted">{row.late}</td>
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
                <tr className="text-muted border-b border-line">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white hover:bg-surface/30">
                    <td className="py-4 font-medium text-ink">{req.employee}</td>
                    <td className="py-4 text-muted text-muted">{req.leaveType}</td>
                    <td className="py-4 text-muted text-muted">
                      <div>{req.startDate} to {req.endDate}</div>
                      <div className="text-xs text-muted">{req.days} days</div>
                    </td>
                    <td className="py-4 text-muted">{req.reason}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${req.status === 'Approved' ? 'bg-brand/10 text-brand bg-brand/10' : 'bg-brand/10 text-brand bg-brand/10'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {req.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button className="p-1 text-brand hover:bg-brand/10 rounded hover:bg-brand/10"><FiCheck className="w-5 h-5" /></button>
                          <button className="p-1 text-brand hover:bg-brand/10 rounded hover:bg-brand/10"><FiX className="w-5 h-5" /></button>
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
