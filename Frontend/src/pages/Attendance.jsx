import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi';
import api from '../services/api';
import { useSelector } from 'react-redux';

const StatCard = ({ icon: Icon, label, value, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-20 dark:bg-opacity-10 backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
      </div>
    </div>
  </motion.div>
);

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (user) {
          const userId = user._id || user.employeeId;
          const res = await api.get(`/attendance?employeeId=${userId}`);
          setRecords(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch attendance', err);
      }
    };
    fetchAttendance();
  }, []);

  const totalDays = records.length;
  const presentDays = records.filter(r => r.status.includes('Present') || r.status === 'Completed').length;
  const lateDays = records.filter(r => r.status === 'Late').length;
  const absentDays = records.filter(r => r.status === 'Absent').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Time & Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Track your daily check-ins, check-outs, and overall punctuality.
          </p>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiCalendar}
          label="Total Days"
          value={totalDays}
          colorClass="bg-blue-500"
          delay={0.1}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Present"
          value={presentDays}
          colorClass="bg-emerald-500"
          delay={0.2}
        />
        <StatCard
          icon={FiClock}
          label="Late"
          value={lateDays}
          colorClass="bg-amber-500"
          delay={0.3}
        />
        <StatCard
          icon={FiAlertCircle}
          label="Absent"
          value={absentDays}
          colorClass="bg-rose-500"
          delay={0.4}
        />
      </div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FiActivity className="text-indigo-500" />
            Recent Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((record, index) => (
                <motion.tr
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (index * 0.1) }}
                  key={record.id || index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <FiCalendar className="w-4 h-4" />
                      </div>
                      {record.date}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span>{record.checkIn || '--:--'}</span>
                      {record.workMode && (
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                          {record.workMode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                    {record.checkOut || '--:--'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border
                      ${record.status.includes('Present') || record.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                        record.status === 'Late'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                          record.status === 'Absent'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }
                    `}>
                      {record.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FiClock className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No attendance records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Attendance;
