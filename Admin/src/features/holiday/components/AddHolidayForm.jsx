import React, { useState } from 'react';

const AddHolidayForm = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Public',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Get the day of the week from the date
    const dayOfWeek = new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });

    setTimeout(() => {
      setLoading(false);
      onSuccess({
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        date: formData.date,
        day: dayOfWeek,
        type: formData.type,
      });
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Holiday Name</label>
        <input 
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          placeholder="e.g. Diwali, Christmas, Independence Day"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Date</label>
        <input 
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink text-muted uppercase tracking-wider">Holiday Type</label>
        <select 
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full px-4 py-2.5 bg-surface/50 border border-line rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
        >
          <option value="Public">Public Holiday</option>
          <option value="Company">Company Holiday</option>
          <option value="Optional">Optional Leave</option>
        </select>
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
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center gap-2"
        >
          {loading ? 'Adding...' : 'Add Holiday'}
        </button>
      </div>
    </form>
  );
};

export default AddHolidayForm;
