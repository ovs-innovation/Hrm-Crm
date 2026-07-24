import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { format } from 'date-fns';

const EmployeeReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    api.get('/reports').then((res) => setReports(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => (r.employeeId?.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <PageShell title="Daily reports" description="End-of-day reports submitted by employees" count={filtered.length}>
      <input type="search" placeholder="Search employee…" className="app-input mb-3 h-9 max-w-sm text-[13px]" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Summary</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No reports submitted.</td></tr>
            ) : filtered.map((report) => (
              <tr key={report._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{report.employeeId?.name || 'Unknown'}</td>
                <td className="px-4 py-3 text-muted">{format(new Date(report.date), 'dd MMM yyyy')}</td>
                <td className="max-w-md truncate px-4 py-3 text-muted">{report.reportText}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setSelectedReport(report)} className="rounded p-1.5 text-muted hover:text-brand"><FiEye className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report detail">
        {selectedReport && (
          <div className="space-y-2 text-[13px]">
            <p className="text-muted">{selectedReport.employeeId?.name} · {format(new Date(selectedReport.date), 'dd MMM yyyy')}</p>
            <p className="whitespace-pre-wrap text-ink">{selectedReport.reportText}</p>
          </div>
        )}
      </Modal>
    </PageShell>
  );
};

export default EmployeeReports;
