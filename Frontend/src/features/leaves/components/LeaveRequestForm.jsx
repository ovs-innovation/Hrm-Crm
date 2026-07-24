import React, { useState } from 'react';

const LeaveRequestForm = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submit
    if(onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Select Employee</label>
        <select 
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
          required
        >
          <option value="" disabled>Select an employee...</option>
          <option value="self">Self (Admin)</option>
          <option value="1">Sarah Smith</option>
          <option value="2">Mike Johnson</option>
          <option value="3">Emily Davis</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Leave Type</label>
        <select 
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
        >
          <option value="Annual Leave">Annual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Casual Leave">Casual Leave</option>
          <option value="Maternity Leave">Maternity Leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Start Date</label>
          <input 
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">End Date</label>
          <input 
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Reason</label>
        <textarea 
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          placeholder="Briefly explain the reason for your leave..."
          required
        ></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-line">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-ink text-muted hover:bg-white hover:bg-surface rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="bg-brand hover:bg-brand text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
        >
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
