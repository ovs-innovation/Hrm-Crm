import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEye, FiCpu } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageShell from '../../components/PageShell';
import AddEmployeeForm from '../../features/employees/components/AddEmployeeForm';
import CsvImportButton from '../../components/CsvImportButton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [modalTab, setModalTab] = useState('profile');

  useEffect(() => {
    if (!viewEmployee) {
      setAiSummary(null);
      setLoadingAi(false);
      setTimeline(null);
      setLoadingTimeline(false);
      setModalTab('profile');
    }
  }, [viewEmployee]);

  const handleGenerateAI = async (empId) => {
    setLoadingAi(true);
    try {
      const res = await api.get(`/ai/employee-card/${empId}`);
      setAiSummary(res.data.insights);
    } catch {
      toast.error('Failed to generate AI insights');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFetchTimeline = async (empId) => {
    setLoadingTimeline(true);
    try {
      const res = await api.get(`/ai/employee-timeline/${empId}`);
      setTimeline(res.data.timeline);
    } catch {
      toast.error('Failed to load employee timeline');
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.map((emp) => ({ ...emp, id: emp.employeeId || emp._id })));
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((emp) =>
    [emp.id, emp.name, emp.email].some((v) => String(v || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (emp) => {
    if (!window.confirm(`Remove ${emp.name}?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch {
      toast.error('Failed to remove employee');
    }
  };

  return (
    <PageShell
      title="Employees"
      description="Manage staff records and access"
      count={filtered.length}
      actions={
        <div className="flex gap-2">
          <CsvImportButton type="employees" label="Import" onDone={fetchEmployees} />
          <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add employee
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <input
          type="search"
          placeholder="Search by ID, name, or email…"
          className="app-input h-9 max-w-sm text-[13px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Department</th>
              <th className="px-4 py-2.5 font-medium">Designation</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No employees found.</td></tr>
            ) : filtered.map((emp) => (
              <tr key={emp._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 text-muted">{emp.id}</td>
                <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                <td className="px-4 py-3 text-muted">{emp.email}</td>
                <td className="px-4 py-3 text-muted">{emp.department || '—'}</td>
                <td className="px-4 py-3 text-muted">{emp.designation || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setViewEmployee(emp)} className="mr-1 rounded p-1.5 text-muted hover:text-brand"><FiEye className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => handleDelete(emp)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add employee" size="xl">
        <AddEmployeeForm onCancel={() => setIsAddModalOpen(false)} onSuccess={(data) => { setIsAddModalOpen(false); fetchEmployees(); toast.success(data?.inviteSent ? 'Employee added — invite email sent' : 'Employee added'); }} />
      </Modal>

      <Modal isOpen={!!viewEmployee} onClose={() => setViewEmployee(null)} title="Employee Profile & Insights" size="lg">
        {viewEmployee && (
          <div className="space-y-6">
            {/* Modal Tabs selector */}
            <div className="flex gap-2 border-b border-line pb-2.5">
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === 'profile' ? 'bg-brand text-white' : 'text-muted hover:bg-soft hover:text-ink'
                }`}
              >
                Profile & AI Scorecard
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('timeline');
                  if (!timeline) handleFetchTimeline(viewEmployee.employeeId || viewEmployee._id);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === 'timeline' ? 'bg-brand text-white' : 'text-muted hover:bg-soft hover:text-ink'
                }`}
              >
                Employee Activity Timeline
              </button>
            </div>

            {modalTab === 'profile' ? (
              <div className="space-y-6">
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><dt className="text-muted">Name</dt><dd className="font-medium text-ink">{viewEmployee.name}</dd></div>
                  <div><dt className="text-muted">Email</dt><dd className="text-ink">{viewEmployee.email}</dd></div>
                  <div><dt className="text-muted">Department</dt><dd className="text-ink">{viewEmployee.department || '—'}</dd></div>
                  <div><dt className="text-muted">Branch</dt><dd className="text-ink">{viewEmployee.branch || '—'}</dd></div>
                </dl>

                <div className="border-t border-line pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold flex items-center gap-1.5"><FiCpu className="text-brand" /> AI Performance Summary</h4>
                    {!aiSummary && !loadingAi && (
                      <button
                        type="button"
                        onClick={() => handleGenerateAI(viewEmployee.employeeId || viewEmployee._id)}
                        className="btn-outline px-3 py-1 text-xs font-semibold"
                      >
                        Generate Insights
                      </button>
                    )}
                  </div>

                  {loadingAi && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-brand"></div>
                      Generating AI profile scorecard...
                    </div>
                  )}

                  {aiSummary && (
                    <div className="rounded-xl border border-line bg-soft/50 p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold">Attendance Score</span>
                          <p className="text-sm font-black text-ink">{aiSummary.attendanceScore}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold">Performance Status</span>
                          <p className="text-sm font-black text-ink">{aiSummary.performance}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold">Risk Classification</span>
                          <p className={`text-sm font-black ${aiSummary.riskLevel === 'Low' ? 'text-green-500' : 'text-amber-500'}`}>{aiSummary.riskLevel}</p>
                        </div>
                      </div>

                      <div className="grid gap-2 border-t border-line/60 pt-2">
                        <div><span className="text-[10px] text-muted uppercase font-bold">Late Mark Trend</span><p className="text-ink">{aiSummary.lateLoginPattern}</p></div>
                        <div><span className="text-[10px] text-muted uppercase font-bold">Leave Mark Trend</span><p className="text-ink">{aiSummary.leavePattern}</p></div>
                        <div><span className="text-[10px] text-muted uppercase font-bold">Task Completion</span><p className="text-ink">{aiSummary.taskCompletion}</p></div>
                        <div><span className="text-[10px] text-muted uppercase font-bold">Promotion recommendation</span><p className="text-ink font-semibold text-brand">{aiSummary.promotionSuggestion}</p></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-line/60 pt-2">
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold">Candidate Strengths</span>
                          <div className="space-y-0.5 mt-1 text-muted">
                            {aiSummary.strengths?.map((s, idx) => <div key={idx}>• {s}</div>)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase font-bold">Training Suggestions</span>
                          <p className="text-ink mt-1 font-medium">{aiSummary.trainingRecommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Chronological Activity & Audits</h4>
                
                {loadingTimeline && (
                  <div className="flex items-center gap-2 text-xs text-muted py-6 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                    Compiling employee activity history timeline...
                  </div>
                )}

                {!loadingTimeline && (!timeline || timeline.length === 0) ? (
                  <p className="text-xs text-muted text-center py-6 font-semibold">No recent activity logs recorded for this employee.</p>
                ) : (
                  <div className="relative pl-4 border-l border-line space-y-4 max-h-[300px] overflow-y-auto">
                    {timeline?.map((item, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Bullet point indicator */}
                        <span className="absolute -left-[20.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand flex-shrink-0"></span>
                        <div className="bg-soft/40 border border-line rounded-xl p-3 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-ink">{item.title}</span>
                            <span className="text-muted font-mono">{new Date(item.date).toLocaleDateString('en-IN')}</span>
                          </div>
                          <p className="text-muted text-[11px] font-medium">{item.details}</p>
                          <span className="inline-block text-[9px] bg-brand/10 text-brand font-bold px-1.5 py-0.5 rounded">
                            {item.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageShell>
  );
};

export default EmployeeList;
