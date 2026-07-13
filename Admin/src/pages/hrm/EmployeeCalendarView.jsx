import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const EmployeeCalendarView = ({ employeeId, monthStr }) => {
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);

  // Parse monthStr (YYYY-MM) to get year and month
  const [year, month] = monthStr.split('-').map(Number);

  // Array of days for calendar header
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (!employeeId || !monthStr) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const newEvents = {};

        // 1. Fetch Holidays
        const holidayRes = await api.get('/holidays');
        holidayRes.data.forEach(holiday => {
          if (!newEvents[holiday.date]) newEvents[holiday.date] = [];
          newEvents[holiday.date].push({
            type: 'holiday',
            title: holiday.name,
            reason: holiday.type + ' Holiday'
          });
        });

        // 2. Fetch Leaves
        const leavesRes = await api.get(`/leaves?employeeId=${employeeId}`);
        leavesRes.data.forEach(leave => {
          let curr = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          while (curr <= end) {
            const dateString = curr.toISOString().split('T')[0];
            if (!newEvents[dateString]) newEvents[dateString] = [];

            // Only show approved or rejected, or pending if you want to see all
            newEvents[dateString].push({
              type: leave.status.toLowerCase(), // 'approved', 'rejected', 'pending'
              title: leave.type,
              reason: leave.reason
            });

            curr.setDate(curr.getDate() + 1);
          }
        });

        // 3. Fetch Attendance
        const attRes = await api.get(`/attendance?employeeId=${employeeId}&month=${monthStr}`);
        attRes.data.forEach(record => {
          if (!newEvents[record.date]) newEvents[record.date] = [];
          newEvents[record.date].push({
            type: 'attendance',
            title: 'Present',
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.status
          });
        });

        setEvents(newEvents);
      } catch (error) {
        console.error('Failed to fetch calendar data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, monthStr]);

  // Calendar logic
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay();

  // Note: Date constructor uses 0-indexed month, so month is m-1
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to determine cell styling based on events
  const getEventStyles = (type) => {
    switch (type) {
      case 'holiday': return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
      case 'pending': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
      case 'rejected': return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 line-through opacity-70';
      case 'attendance': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <div className="animate-pulse">Loading calendar data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl mt-6">

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm font-medium">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Approved Leave</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pending Leave</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Rejected Leave</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Company Holiday</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Attendance Present</div>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900/30 opacity-50"></div>
        ))}

        {days.map(day => {
          // JS Date sets month as 0-indexed, so we subtract 1 from month for Date logic
          // But string comparison needs standard format
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const dayEvents = events[dateString] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateString;

          return (
            <div
              key={day}
              className={`aspect-square p-1 sm:p-2 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-start relative overflow-hidden group
                ${isToday
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }
              `}
            >
              <span className={`text-sm sm:text-base font-semibold z-10 mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {day}
              </span>

              <div className="w-full flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {dayEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    title={evt.reason || evt.status}
                    className={`w-full text-[10px] sm:text-xs font-medium py-1 px-1.5 rounded text-center border truncate transition-transform hover:scale-105 cursor-default ${getEventStyles(evt.type)}`}
                  >
                    {evt.type === 'attendance' ? (
                      <div className="flex flex-col leading-tight">
                        <span>{evt.checkIn || '-'}</span>
                        <span>{evt.checkOut || '-'}</span>
                      </div>
                    ) : (
                      evt.title
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeCalendarView;
