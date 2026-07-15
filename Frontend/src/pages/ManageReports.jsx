import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiCalendar, FiUser, FiClock, FiEye, FiX } from 'react-icons/fi';
import api from '../services/api';
import { format } from 'date-fns';

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching employee reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const employeeName = report.employeeId?.name || '';
    return employeeName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Employee Daily Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review end-of-day reports submitted by employees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200 transition-all"
          />
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Report Summary</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <tr key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                          {report.employeeId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{report.employeeId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{report.employeeId?.designation || 'No designation'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <FiCalendar className="text-slate-400" />
                        {format(new Date(report.date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-1 max-w-md">
                        {report.reportText}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiEye /> View Full
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    <FiFileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p>No reports found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Full Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {selectedReport.employeeId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedReport.employeeId?.name || 'Unknown'}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> {selectedReport.employeeId?.designation}</span>
                    <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> {format(new Date(selectedReport.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Daily Report</h4>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {selectedReport.reportText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReports;
