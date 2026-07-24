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
          <h2 className="text-[15px] font-semibold text-ink tracking-tight">Employee Daily Reports</h2>
          <p className="text-muted text-muted text-sm mt-1">Review end-of-day reports submitted by employees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-line flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg focus:ring-2 focus:ring-brand/30 outline-none text-ink text-ink transition-all"
          />
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface/50 text-muted text-muted border-b border-line">
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Report Summary</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <tr key={report._id} className="hover:bg-white hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 bg-brand/10 flex items-center justify-center text-brand text-brand font-bold flex-shrink-0">
                          {report.employeeId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{report.employeeId?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted text-muted">{report.employeeId?.designation || 'No designation'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted text-muted font-medium">
                        <FiCalendar className="text-muted" />
                        {format(new Date(report.date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-muted text-muted line-clamp-1 max-w-md">
                        {report.reportText}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand hover:bg-brand/10 text-brand rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiEye /> View Full
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-muted">
                    <FiFileText className="w-12 h-12 mx-auto mb-3 text-muted" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
          <div className="bg-surface rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-line" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-line border-line pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 bg-brand/10 flex items-center justify-center text-brand text-brand font-bold text-lg">
                  {selectedReport.employeeId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">{selectedReport.employeeId?.name || 'Unknown'}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted text-muted">
                    <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> {selectedReport.employeeId?.designation}</span>
                    <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> {format(new Date(selectedReport.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 text-muted hover:text-muted bg-surface rounded-full transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-surface/50 rounded-xl p-5 border border-line border-line">
              <h4 className="text-sm font-semibold text-muted text-muted uppercase tracking-wider mb-3">Daily Report</h4>
              <p className="text-ink text-muted whitespace-pre-wrap leading-relaxed text-sm md:text-base">
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
