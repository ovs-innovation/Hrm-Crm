import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ActivityTimeline = ({ entityType, entityId, entityLabel }) => {
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/activities?entityType=${entityType}&entityId=${entityId}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api.post('/activities', {
      entityType,
      entityId,
      entityLabel,
      type: 'note',
      title: 'Note added',
      body: note.trim(),
    });
    setNote('');
    load();
  };

  return (
    <div className="space-y-3">
      <form onSubmit={addNote} className="flex gap-2">
        <input
          className="app-input h-8 flex-1 text-[13px]"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" className="btn-primary h-8 px-3 text-[13px]">Add</button>
      </form>
      {loading ? (
        <p className="text-[13px] text-muted">Loading timeline…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-muted">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a._id} className="rounded border border-line bg-soft/50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-ink">{a.title}</p>
                <span className="shrink-0 text-[11px] text-muted">{new Date(a.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {a.body && <p className="mt-1 text-[12px] text-muted">{a.body}</p>}
              {a.createdByName && <p className="mt-1 text-[11px] text-muted">— {a.createdByName}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityTimeline;
