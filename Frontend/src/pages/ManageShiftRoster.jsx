import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, 
  FiPlus, 
  FiX, 
  FiBriefcase, 
  FiHome, 
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';

const mockEmployees = [
  { id: 1, name: 'John Doe', department: 'Engineering' },
  { id: 2, name: 'Sarah Smith', department: 'Design' },
  { id: 3, name: 'Mike Johnson', department: 'Marketing' },
  { id: 4, name: 'Emily Davis', department: 'Support' },
];

// Mock roster for a week (Mon-Fri)
const mockRoster = {
  1: { mon: { mode: 'WFO', shift: 'Morning 9-5' }, tue: { mode: 'WFO', shift: 'Morning 9-5' }, wed: { mode: 'WFH', shift: 'Morning 9-5' }, thu: { mode: 'WFH', shift: 'Morning 9-5' }, fri: { mode: 'WFO', shift: 'Morning 9-5' } },
  2: { mon: { mode: 'WFH', shift: 'Morning 9-5' }, tue: { mode: 'WFH', shift: 'Morning 9-5' }, wed: { mode: 'WFH', shift: 'Morning 9-5' }, thu: { mode: 'WFH', shift: 'Morning 9-5' }, fri: { mode: 'WFH', shift: 'Morning 9-5' } },
  3: { mon: { mode: 'Field', shift: 'Evening 2-10' }, tue: { mode: 'Field', shift: 'Evening 2-10' }, wed: { mode: 'WFO', shift: 'Evening 2-10' }, thu: { mode: 'WFH', shift: 'Evening 2-10' }, fri: { mode: 'Off', shift: 'Rest Day' } },
  4: { mon: { mode: 'WFO', shift: 'Morning 9-5' }, tue: { mode: 'WFO', shift: 'Morning 9-5' }, wed: { mode: 'WFO', shift: 'Morning 9-5' }, thu: { mode: 'WFO', shift: 'Morning 9-5' }, fri: { mode: 'WFO', shift: 'Morning 9-5' } },
};

const getShiftBadge = (shiftData) => {
  if (!shiftData || shiftData.mode === 'Off') {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed">
        <span className="text-xs font-medium text-slate-400">Off Day</span>
      </div>
    );
  }

  const isWFO = shiftData.mode === 'WFO';
  const isWFH = shiftData.mode === 'WFH';
  const isField = shiftData.mode === 'Field';

  let colorClass = '';
  let Icon = null;

  if (isWFO) {
    colorClass = 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    Icon = FiBriefcase;
  } else if (isWFH) {
    colorClass = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    Icon = FiHome;
  } else {
    colorClass = 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    Icon = FiMapPin;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${colorClass} transition-all hover:scale-105 cursor-pointer`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-black">{shiftData.mode}</span>
      </div>
      <span className="text-[10px] font-semibold opacity-80">{shiftData.shift}</span>
    </div>
  );
};

const ShiftRoster = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-indigo-500 w-6 h-6" />
              </div>
              Shift Roster
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage employee work schedules, timings, and location modes.</p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <FiPlus />
            Assign Shift
          </motion.button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <FiCalendar className="text-slate-400 w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Week of July 13 - July 17, 2026</h3>
          </div>
          <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold text-slate-500">Work Modes:</span>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg font-bold border border-blue-200 dark:border-blue-500/20">
            <FiBriefcase className="w-4 h-4" /> Office (WFO)
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg font-bold border border-emerald-200 dark:border-emerald-500/20">
            <FiHome className="w-4 h-4" /> Home (WFH)
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-lg font-bold border border-amber-200 dark:border-amber-500/20">
            <FiMapPin className="w-4 h-4" /> Field Work
          </div>
        </div>

        {/* Roster Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Employee</th>
                  <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Mon 13</th>
                  <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Tue 14</th>
                  <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Wed 15</th>
                  <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Thu 16</th>
                  <th className="py-4 px-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Fri 17</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {mockEmployees.map((emp, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={emp.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                          <div className="text-xs font-medium text-slate-500">{emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center align-middle">
                      {getShiftBadge(mockRoster[emp.id]?.mon)}
                    </td>
                    <td className="py-2 px-2 text-center align-middle">
                      {getShiftBadge(mockRoster[emp.id]?.tue)}
                    </td>
                    <td className="py-2 px-2 text-center align-middle">
                      {getShiftBadge(mockRoster[emp.id]?.wed)}
                    </td>
                    <td className="py-2 px-2 text-center align-middle">
                      {getShiftBadge(mockRoster[emp.id]?.thu)}
                    </td>
                    <td className="py-2 px-2 text-center align-middle">
                      {getShiftBadge(mockRoster[emp.id]?.fri)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Shift Modal */}
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
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FiClock className="text-indigo-500" />
                  Assign Shift
                </h3>
                <p className="text-slate-500 font-medium mt-2">
                  Set work timings and location mode for an employee.
                </p>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Employee</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option>Select an employee</option>
                    <option>John Doe</option>
                    <option>Sarah Smith</option>
                    <option>Mike Johnson</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date Range</label>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Until</label>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Time Shift</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                      <option>Morning (9 AM - 5 PM)</option>
                      <option>Evening (2 PM - 10 PM)</option>
                      <option>Night (10 PM - 6 AM)</option>
                      <option>Rest Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Location Mode</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                      <option>Office (WFO)</option>
                      <option>Home (WFH)</option>
                      <option>Field Work</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                  <button type="submit" className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-5 h-5" />
                    Confirm & Assign
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShiftRoster;
