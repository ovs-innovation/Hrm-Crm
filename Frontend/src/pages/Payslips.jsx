import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDownload, 
  FiEye, 
  FiDollarSign, 
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';

const mockPayslips = [
  { id: 1, month: 'June', year: '2026', basicPay: 5000, allowances: 1200, deductions: 400, netPay: 5800, status: 'Paid', date: 'Jun 30, 2026' },
  { id: 2, month: 'May', year: '2026', basicPay: 5000, allowances: 1200, deductions: 400, netPay: 5800, status: 'Paid', date: 'May 31, 2026' },
  { id: 3, month: 'April', year: '2026', basicPay: 5000, allowances: 1000, deductions: 350, netPay: 5650, status: 'Paid', date: 'Apr 30, 2026' },
  { id: 4, month: 'March', year: '2026', basicPay: 5000, allowances: 1000, deductions: 350, netPay: 5650, status: 'Paid', date: 'Mar 31, 2026' },
  { id: 5, month: 'February', year: '2026', basicPay: 4500, allowances: 800, deductions: 300, netPay: 5000, status: 'Paid', date: 'Feb 28, 2026' },
];

const StatCard = ({ icon: Icon, label, value, trend, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-20 dark:bg-opacity-10 backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
          <FiTrendingUp className="w-3 h-3" />
          {trend}
        </span>
        <span className="text-slate-500 dark:text-slate-400">vs last year</span>
      </div>
    )}
  </motion.div>
);

const Payslips = () => {
  const [selectedSlip, setSelectedSlip] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            My Payslips
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            View and download your monthly salary statements
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          icon={FiDollarSign} 
          label="YTD Earnings (2026)" 
          value="$27,900.00" 
          trend="+12.5%"
          colorClass="bg-blue-500" 
        />
        <StatCard 
          icon={FiFileText} 
          label="Latest Net Pay (June)" 
          value="$5,800.00"
          colorClass="bg-indigo-500" 
        />
        <StatCard 
          icon={FiCheckCircle} 
          label="Tax Deductions YTD" 
          value="$1,800.00" 
          colorClass="bg-rose-500" 
        />
      </div>

      {/* Payslips List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiCalendar className="text-blue-500" />
            Payment History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Month/Year</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Paid</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Pay</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Pay</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {mockPayslips.map((slip, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={slip.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {slip.month} {slip.year}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                    {slip.date}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(slip.basicPay + slip.allowances)}
                  </td>
                  <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(slip.netPay)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      {slip.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedSlip(slip)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedSlip && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedSlip(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            >
              <button 
                onClick={() => setSelectedSlip(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <FiDollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Salary Slip
                </h3>
                <p className="text-slate-500 font-medium">
                  {selectedSlip.month} {selectedSlip.year}
                </p>
              </div>

              <div className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Basic Pay</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(selectedSlip.basicPay)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Allowances</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(selectedSlip.allowances)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Deductions</span>
                  <span className="font-semibold text-rose-500">-{formatCurrency(selectedSlip.deductions)}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-lg">Net Pay</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-xl">{formatCurrency(selectedSlip.netPay)}</span>
                </div>
              </div>

              <button className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                <FiDownload className="w-5 h-5" />
                Download PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payslips;
