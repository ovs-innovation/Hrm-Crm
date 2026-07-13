import React, { useState, useEffect } from 'react';
import { orgService } from '../services/orgService';
import { motion } from 'framer-motion';
import { FiBriefcase, FiPlus, FiMoreVertical, FiUsers } from 'react-icons/fi';
import { Skeleton } from '../../../components';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await orgService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FiBriefcase className="text-blue-500 w-6 h-6" />
            </div>
            Departments
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage company departments and structural hierarchy.</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <FiPlus />
          Add Department
        </motion.button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department Head</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Employees</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={`sk-dept-${i}`}>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-32" /></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">
                    No departments found.
                  </td>
                </tr>
              ) : (
                departments.map((dept, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={dept.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {dept.name.charAt(0)}
                        </div>
                        {dept.name}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {dept.head.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.head}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-3 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                        <FiUsers className="w-3.5 h-3.5" />
                        {dept.employeeCount} Members
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                        ${dept.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
                        }
                      `}>
                        <span className={`w-2 h-2 rounded-full ${dept.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {dept.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10">
                        <FiMoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;
