import React, { useState, useEffect } from 'react';
import { orgService } from '../services/orgService';
import { motion } from 'framer-motion';
import { FiAward, FiPlus, FiMoreVertical, FiTrendingUp } from 'react-icons/fi';
import { Skeleton } from '../../../components';

const DesignationList = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const data = await orgService.getDesignations();
        setDesignations(data);
      } catch (error) {
        console.error("Failed to fetch designations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDesignations();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <FiAward className="text-purple-500 w-6 h-6" />
            </div>
            Designations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage job titles, roles, and hierarchy levels.</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
        >
          <FiPlus />
          Add Designation
        </motion.button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Designation Title</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={`sk-desig-${i}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : designations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">
                    No designations found.
                  </td>
                </tr>
              ) : (
                designations.map((desig, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={desig.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                          {desig.title.charAt(0)}
                        </div>
                        {desig.title}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                      {desig.department}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-3 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                        <FiTrendingUp className="w-3.5 h-3.5 text-purple-500" />
                        Level {desig.level}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                        ${desig.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
                        }
                      `}>
                        <span className={`w-2 h-2 rounded-full ${desig.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {desig.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10">
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

export default DesignationList;
