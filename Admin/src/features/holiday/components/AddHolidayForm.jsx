import React, { useState } from 'react';

const inputClass =
  'w-full px-4 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all';

const AddHolidayForm = ({ onCancel, onSuccess, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Public',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const [year, month, day] = String(formData.date || '').split('-').map(Number);
    const parsed = year && month && day ? new Date(year, month - 1, day) : new Date(formData.date);
    const dayOfWeek = parsed.toLocaleDateString('en-US', { weekday: 'long' });
    const payload = {
      name: formData.name,
      date: formData.date,
      day: dayOfWeek,
      type: formData.type,
    };

    try {
      const submit = onSubmit || onSuccess;
      if (typeof submit !== 'function') {
        throw new Error('No submit handler provided');
      }
      await submit(payload);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not save holiday');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Holiday Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClass}
          placeholder="e.g. Diwali, Christmas, Independence Day"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Holiday Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className={`${inputClass} appearance-none`}
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
          className="px-4 py-2 text-muted hover:bg-soft rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
        >
          {loading ? 'Adding...' : 'Add Holiday'}
        </button>
      </div>
    </form>
  );
};

export default AddHolidayForm;
