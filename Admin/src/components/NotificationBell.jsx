import React, { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [cRes, nRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/notifications?limit=15'),
      ]);
      setCount(cRes.data.count || 0);
      setItems(nRes.data || []);
    } catch {
      /* ignore when logged out */
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch { /* noop */ }
    setOpen(false);
    load();
    if (link) navigate(link);
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative rounded p-1.5 text-muted hover:bg-soft hover:text-ink"
        aria-label="Notifications"
      >
        <FiBell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[13px] font-semibold text-ink">Notifications</span>
            {count > 0 && (
              <button type="button" onClick={markAll} className="text-[12px] text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted">No notifications</p>
            ) : items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => markRead(n._id, n.link)}
                className={`block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-soft ${n.read ? 'opacity-70' : ''}`}
              >
                <p className="text-[13px] font-medium text-ink">{n.title}</p>
                {n.message && <p className="mt-0.5 text-[12px] text-muted line-clamp-2">{n.message}</p>}
                <p className="mt-1 text-[11px] text-muted">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
