import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiSearch, 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiX, 
  FiSettings
} from 'react-icons/fi';

const mockEmployees = [
  { id: 'EMP-001', name: 'John Doe', department: 'Engineering', status: 'Pending', baseSalary: 5000 },
  { id: 'EMP-002', name: 'Sarah Smith', department: 'Design', status: 'Issued', baseSalary: 4500 },
  { id: 'EMP-003', name: 'Mike Johnson', department: 'Marketing', status: 'Pending', baseSalary: 4200 },
  { id: 'EMP-004', name: 'Emily Davis', department: 'Engineering', status: 'Issued', baseSalary: 5200 },
  { id: 'EMP-005', name: 'Robert Wilson', department: 'HR', status: 'Pending', baseSalary: 4000 },
];

const Payroll = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);

  const filteredEmployees = mockEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateClick = (e, emp) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEmp(emp);
  };

  const handleConfirmGeneration = (e) => {
    e.preventDefault();
    // Simulate generation then route to invoice view
    navigate(`/hrm/payroll/invoice/${selectedEmp.id}`);
  };

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <FiDollarSign className="text-indigo-500 w-6 h-6" />
            </div>
            Payroll Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Generate and manage monthly salary slips.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Salary</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEmployees.map((emp, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={emp.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        <div className="text-xs font-semibold text-slate-400">{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                    {emp.department}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                    ${emp.baseSalary}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                      ${emp.status === 'Issued' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      }
                    `}>
                      {emp.status === 'Issued' ? <FiCheckCircle /> : <FiClock />}
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {emp.status === 'Issued' ? (
                      <button 
                        onClick={() => navigate(`/hrm/payroll/invoice/${emp.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors text-sm"
                      >
                        <FiFileText />
                        View Slip
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => handleGenerateClick(e, emp)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg transition-colors text-sm border border-indigo-200 dark:border-indigo-500/30"
                      >
                        <FiSettings />
                        Generate
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Generate Payslip Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedEmp(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            >
              <button 
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Generate Payslip
                </h3>
                <p className="text-slate-500 font-medium mt-1">
                  Configure salary details for {selectedEmp.name}.
                </p>
              </div>

              <form onSubmit={handleConfirmGeneration} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Base Salary</label>
                    <input type="number" defaultValue={selectedEmp.baseSalary} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">House Rent Allowance</label>
                    <input type="number" defaultValue={1000} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tax Deduction</label>
                    <input type="number" defaultValue={200} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Provident Fund</label>
                    <input type="number" defaultValue={150} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                  <button type="submit" className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-5 h-5" />
                    Confirm & Generate
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

export default Payroll;
