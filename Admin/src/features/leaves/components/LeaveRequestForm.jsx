import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const LeaveRequestForm = ({ onCancel, onSubmit }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '', leaveType: 'Annual Leave', startDate: '', endDate: '', reason: '',
  });

  useEffect(() => {
    api.get('/employees').then((res) => setEmployees(res.data)).catch(console.error);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="app-label mb-1 block text-[13px]">Employee</label>
        <select name="employeeId" required className="app-input h-9 text-[13px]" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}>
          <option value="" disabled>Select employee…</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>{emp.name} — {emp.department || emp.designation}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="app-label mb-1 block text-[13px]">Leave type</label>
        <select className="app-input h-9 text-[13px]" value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}>
          <option>Annual Leave</option>
          <option>Sick Leave</option>
          <option>Casual Leave</option>
          <option>Maternity Leave</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="app-label mb-1 block text-[13px]">Start</label><input required type="date" className="app-input h-9 text-[13px]" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
        <div><label className="app-label mb-1 block text-[13px]">End</label><input required type="date" className="app-input h-9 text-[13px]" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
      </div>
      <div>
        <label className="app-label mb-1 block text-[13px]">Reason</label>
        <textarea required rows={3} className="app-input text-[13px]" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <button type="button" onClick={onCancel} className="btn-outline h-9 px-3 text-[13px]">Cancel</button>
        <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Submit</button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
