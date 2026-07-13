import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiPlus,
  FiBriefcase,
  FiHeart,
  FiX,
  FiSend
} from 'react-icons/fi';

const LeaveCalendar = () => {
  const user = useSelector((state) => state.auth.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const joiningDate = new Date(2020, 0, 1);

  // Form states
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [events, setEvents] = useState({});

  const fetchMyLeaves = async () => {
    try {
      if (user) {
        const userId = user._id || user.employeeId;
        const response = await axios.get(`http://localhost:5000/api/leaves?employeeId=${userId}`, { withCredentials: true });
        const fetchedLeaves = response.data;
        
        // Fetch holidays
        const holidayResponse = await axios.get('http://localhost:5000/api/holidays');
        const fetchedHolidays = holidayResponse.data;

        const newEvents = {};

        fetchedHolidays.forEach(holiday => {
          newEvents[holiday.date] = {
            title: holiday.name,
            type: 'holiday',
            reason: holiday.type + ' Holiday'
          };
        });

        fetchedLeaves.forEach(leave => {
          let curr = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          while (curr <= end) {
            const dateString = curr.toISOString().split('T')[0];
            newEvents[dateString] = {
              title: leave.type,
              type: leave.status.toLowerCase(),
              reason: leave.reason
            };
            curr.setDate(curr.getDate() + 1);
          }
        });
        setEvents(newEvents);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  React.useEffect(() => {
    fetchMyLeaves();
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        type: 'padding'
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      dayDate.setHours(0, 0, 0, 0);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const isBeforeJoining = dayDate < joiningDate;
      const event = events[dateString];
      const isToday = dayDate.getTime() === today.getTime();

      let dayType = 'regular';
      let eventTitle = null;
      let eventReason = null;

      if (isBeforeJoining) {
        dayType = 'pre-joining';
        eventTitle = 'Not Joined';
      } else if (event) {
        dayType = event.type;
        eventTitle = event.title;
        eventReason = event.reason;
      } else if (isWeekend) {
        dayType = 'weekend';
      } else if (dayDate <= today) {
        dayType = 'present';
        eventTitle = 'Present';
      } else {
        dayType = 'regular';
      }

      days.push({
        date: i,
        isCurrentMonth: true,
        isToday,
        type: dayType,
        event: eventTitle,
        reason: eventReason
      });
    }

    const totalBoxes = days.length > 35 ? 42 : 35;
    const remainingDays = totalBoxes - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        type: 'padding'
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getEventStyles = (type) => {
    switch (type) {
      case 'holiday': return 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-l-2 border-purple-500';
      case 'approved': return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-l-2 border-emerald-500';
      case 'pending': return 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-l-2 border-amber-500';
      case 'rejected': return 'bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-l-2 border-red-500 line-through decoration-red-400';
      case 'present': return 'bg-blue-50/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 border-l-2 border-blue-400';
      case 'pre-joining': return 'bg-slate-100/50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500';
      case 'weekend': return 'bg-transparent text-slate-400 dark:text-slate-500';
      default: return 'bg-transparent';
    }
  };

  const currentMonthStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Leave & Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your schedule, track leaves, and view holidays
          </p>
        </motion.div>
        <motion.button 
          onClick={() => setIsModalOpen(true)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
        >
          <FiPlus className="w-5 h-5" />
          Request Leave
        </motion.button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6"
        >
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <FiBriefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Annual Leave</span>
              <span className="font-black text-2xl text-slate-900 dark:text-white">12 <span className="text-sm font-medium text-slate-400">/ 20</span></span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6"
        >
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
            <FiHeart className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Sick Leave</span>
              <span className="font-black text-2xl text-slate-900 dark:text-white">5 <span className="text-sm font-medium text-slate-400">/ 10</span></span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                transition={{ duration: 1, delay: 0.3 }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Calendar Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <FiCalendar className="text-indigo-500" />
              {currentMonthStr}
            </h3>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm hover:shadow">
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleToday} className="px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm hover:shadow">
                Today
              </button>
              <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm hover:shadow">
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <motion.div 
            className="grid grid-cols-7 bg-slate-200 dark:bg-slate-800 gap-px"
            layout
          >
            <AnimatePresence mode="popLayout">
              {calendarDays.map((day, idx) => (
                <motion.div
                  key={`${currentMonthStr}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.01 }}
                  className={`min-h-[120px] bg-white dark:bg-slate-900 p-3 transition-colors group relative
                    ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors
                      ${day.isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 
                        day.isCurrentMonth ? 'text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700' : 'text-slate-400 dark:text-slate-600'
                      }
                    `}>
                      {day.isCurrentMonth ? day.date : ''}
                    </span>
                  </div>

                  {day.event && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-xs p-2 rounded-lg truncate font-semibold shadow-sm backdrop-blur-sm ${getEventStyles(day.type)}`}
                      title={`${day.event}${day.reason ? `\nReason: ${day.reason}` : ''}`}
                    >
                      {day.event}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Legend Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit"
        >
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-6">Status Legend</h4>
          <ul className="space-y-4">
            {[
              { label: 'Present', color: 'bg-blue-500 shadow-blue-500/50' },
              { label: 'Approved Leave', color: 'bg-emerald-500 shadow-emerald-500/50' },
              { label: 'Pending Request', color: 'bg-amber-500 shadow-amber-500/50' },
              { label: 'Rejected Leave', color: 'bg-red-500 shadow-red-500/50' },
              { label: 'Company Holiday', color: 'bg-purple-500 shadow-purple-500/50' },
              { label: 'Pre-Joining Date', color: 'bg-slate-400 shadow-slate-400/50' },
            ].map((item, idx) => (
              <motion.li 
                key={idx}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <div className={`w-3.5 h-3.5 rounded-full shadow-md ${item.color}`} />
                {item.label}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Request Leave Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <FiPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Request Leave
                </h3>
                <p className="text-slate-500 font-medium mt-1">
                  Fill out the form below to apply for a leave.
                </p>
              </div>

              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                
                try {
                  if (!user || (!user._id && !user.employeeId)) {
                    alert('You must be logged in to request leave');
                    setIsSubmitting(false);
                    return;
                  }

                  await axios.post('http://localhost:5000/api/leaves', {
                    employeeId: user._id, // the mongo _id
                    employeeName: user.name,
                    type: leaveType,
                    startDate,
                    endDate,
                    reason
                  }, { withCredentials: true });

                  alert('Leave request submitted successfully!');
                  setIsModalOpen(false);
                  // Reset form
                  setLeaveType('Annual Leave');
                  setStartDate('');
                  setEndDate('');
                  setReason('');
                  
                  // Refresh leaves
                  fetchMyLeaves();
                } catch (error) {
                  console.error('Error submitting leave:', error);
                  alert('Failed to submit leave request');
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Leave Type</label>
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                    <option>Annual Leave</option>
                    <option>Sick Leave</option>
                    <option>Unpaid Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
                  <textarea 
                    rows="3" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" placeholder="Please provide a brief reason..."></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70">
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveCalendar;
