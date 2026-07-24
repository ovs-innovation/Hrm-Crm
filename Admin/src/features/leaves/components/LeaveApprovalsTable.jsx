import React, { useState, useEffect } from 'react';
import { leaveService } from '../services/leaveService';
import Modal from '../../../components/Modal';
import PageShell from '../../../components/PageShell';
import LeaveRequestForm from './LeaveRequestForm';
import api from '../../../services/api';

const LeaveApprovalsTable = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      setLeaves(await leaveService.getLeaves());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleUpdateStatus = async (id, status) => {
    await leaveService.updateLeaveStatus(id, status);
    fetchLeaves();
  };

  const handleCreateLeave = async (formData) => {
    const empRes = await api.get('/employees');
    const employee = empRes.data.find((e) => e._id === formData.employeeId || e.employeeId === formData.employeeId);
    await api.post('/leaves', {
      employeeId: employee?._id || formData.employeeId,
      employeeName: employee?.name || 'Unknown',
      type: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
    });
    setIsModalOpen(false);
    fetchLeaves();
  };

  return (
    <PageShell
      title="Leave requests"
      description="Review and approve employee leave"
      count={leaves.length}
      actions={
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          Request leave
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Duration</th>
              <th className="px-4 py-2.5 font-medium">Reason</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : leaves.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No leave requests.</td></tr>
            ) : leaves.map((leave) => (
              <tr key={leave.id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{leave.employee}</td>
                <td className="px-4 py-3 text-muted">{leave.type}</td>
                <td className="px-4 py-3 text-muted">{leave.startDate} → {leave.endDate}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted">{leave.reason}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{leave.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {leave.status === 'Pending' && (
                    <>
                      <button type="button" onClick={() => handleUpdateStatus(leave.id, 'Approved')} className="mr-2 text-[13px] font-medium text-brand">Approve</button>
                      <button type="button" onClick={() => handleUpdateStatus(leave.id, 'Rejected')} className="text-[13px] font-medium text-danger">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request leave">
        <LeaveRequestForm onCancel={() => setIsModalOpen(false)} onSubmit={handleCreateLeave} />
      </Modal>
    </PageShell>
  );
};

export default LeaveApprovalsTable;
