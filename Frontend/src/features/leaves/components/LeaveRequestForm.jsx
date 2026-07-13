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
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Employee</label>
        <select 
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
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
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Leave Type</label>
        <select 
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
        >
          <option value="Annual Leave">Annual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Casual Leave">Casual Leave</option>
          <option value="Maternity Leave">Maternity Leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Start Date</label>
          <input 
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">End Date</label>
          <input 
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason</label>
        <textarea 
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          placeholder="Briefly explain the reason for your leave..."
          required
        ></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
        >
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
