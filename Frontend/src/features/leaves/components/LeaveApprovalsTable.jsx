import React, { useState, useEffect } from 'react';
import { leaveService } from '../services/leaveService';
import Modal from '../../../components/Modal';
import LeaveRequestForm from './LeaveRequestForm';

const LeaveApprovalsTable = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const data = await leaveService.getLeaves();
        setLeaves(data);
      } catch (error) {
        console.error("Failed to fetch leaves", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await leaveService.updateLeaveStatus(id, status);
      setLeaves(leaves.map(leave => leave.id === id ? { ...leave, status } : leave));
    } catch (error) {
      console.error(`Failed to ${status} leave:`, error);
      alert(`Failed to ${status} leave`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">Leave Management</h2>
          <p className="text-slate-400 font-medium">Review and manage employee leave requests.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Leave
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 border-b border-white/5 text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/20">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading leave requests...</p>
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {leave.employee.split(' ').map(n => n[0]).join('')}
                        </div>
                        {leave.employee}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{leave.type}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 py-1 px-3 rounded-md text-xs border border-white/5">
                        {leave.startDate} to {leave.endDate}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs">{leave.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium 
                        ${leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          leave.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${leave.status === 'Approved' ? 'bg-emerald-500' : 
                            leave.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`}>
                        </span>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {leave.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(leave.id, 'Approved')}
                            className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors border border-emerald-500/30">
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(leave.id, 'Rejected')}
                            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-red-500/30">
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status !== 'Pending' && (
                        <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Request Leave"
        size="md"
      >
        <LeaveRequestForm 
          onCancel={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            try {
              // Admin submits on behalf of someone else (if you add this route in future)
              // For now we'll just log or you can create another endpoint.
              console.log('Leave requested by Admin:', data);
              setIsModalOpen(false);
            } catch (error) {
              console.error(error);
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default LeaveApprovalsTable;
