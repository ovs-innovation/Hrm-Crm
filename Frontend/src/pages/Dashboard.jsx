import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClock, FiLogOut, FiBriefcase, FiHome, FiMapPin, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useSelector } from 'react-redux';

const OFFICE_LAT = 28.582078;
const OFFICE_LON = 77.365970;
const ALLOWED_RADIUS_METERS = 100;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Dashboard = () => {
  const [now, setNow] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCompletedShift, setHasCompletedShift] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const user = useSelector((state) => state.auth.user || {});
  const navigate = useNavigate();
  const userId = user._id || user.employeeId;
  const firstName = (user.name || 'there').split(' ')[0];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];

    const load = async () => {
      try {
        const [attRes, holRes, annRes, taskRes] = await Promise.all([
          api.get(`/attendance?employeeId=${userId}`),
          api.get('/holidays'),
          api.get('/announcements'),
          api.get(`/tasks?employeeId=${user.employeeId || userId}`),
        ]);

        const pending = localStorage.getItem('pendingCheckIn');
        if (pending && JSON.parse(pending).date === today) {
          setIsCheckedIn(true);
          setRecords([JSON.parse(pending), ...attRes.data]);
        } else {
          setRecords(attRes.data);
          const latest = attRes.data[0];
          if (latest?.date === today) {
            if (!latest.checkOut) setIsCheckedIn(true);
            else setHasCompletedShift(true);
          }
        }

        const future = holRes.data
          .filter((h) => new Date(h.date) >= new Date(new Date().toDateString()))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setHolidays(future);
        setAnnouncements(annRes.data.slice(0, 3));
        setPendingTasks(taskRes.data.filter((t) => t.status !== 'Completed').length);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [userId, user.employeeId]);

  const performCheckIn = (mode) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 0);
    const pending = { id: `pending-${Date.now()}`, date: today, checkIn: timeStr, status: isLate ? 'Late (Active)' : 'Present (Active)', workMode: mode };
    localStorage.setItem('pendingCheckIn', JSON.stringify(pending));
    setRecords([pending, ...records.filter((r) => r.date !== today)]);
    setIsCheckedIn(true);
    toast.success(isLate ? `Checked in (late) from ${mode}` : `Checked in from ${mode}`);
  };

  const handleMode = (mode) => {
    setModeModalOpen(false);
    setLocationError('');
    if (mode === 'Home') return performCheckIn('Home');

    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lon } = pos.coords;
        if (mode === 'Office') {
          const d = calculateDistance(OFFICE_LAT, OFFICE_LON, lat, lon);
          if (d <= ALLOWED_RADIUS_METERS) performCheckIn('Office');
          else setLocationError(`You are ${Math.round(d)}m from office. Use Home or Field mode.`);
        } else performCheckIn('Field');
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not get location. Allow GPS or choose Home.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckOut = async () => {
    const today = new Date().toISOString().split('T')[0];
    const pending = localStorage.getItem('pendingCheckIn');
    if (!pending) return toast.error('No active check-in');
    const p = JSON.parse(pending);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const res = await api.post('/attendance/checkin', {
        employeeId: userId,
        date: today,
        checkIn: p.checkIn,
        checkOut: timeStr,
        status: now.getHours() < 18 ? 'Early Leave' : 'Completed',
        workMode: p.workMode,
      });
      localStorage.removeItem('pendingCheckIn');
      setRecords(records.map((r) => (r.date === today ? res.data : r)));
      setIsCheckedIn(false);
      setHasCompletedShift(true);
      toast.success('Shift completed');
    } catch (error) {
      if (error.response?.data?.message === 'MISSING_REPORT') {
        toast.error('Submit daily report before checkout');
        navigate('/daily-reports');
      } else toast.error('Checkout failed');
    }
  };

  const presentDays = records.filter((r) => r.status?.includes('Present') || r.status === 'Completed').length;
  const lateDays = records.filter((r) => r.status?.includes('Late')).length;
  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[13px] text-muted">{todayLabel}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">Welcome back, {firstName}</h1>
          {pendingTasks > 0 && (
            <p className="mt-1 text-[13px] text-muted">{pendingTasks} open task{pendingTasks > 1 ? 's' : ''} · <Link to="/tasks" className="text-brand">View</Link></p>
          )}
        </div>
        <div className="flex items-center gap-3 rounded border border-line bg-surface px-4 py-3">
          <div className="border-r border-line pr-4 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Time</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-ink">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
          {hasCompletedShift ? (
            <span className="rounded bg-brand-xlight px-3 py-2 text-[13px] font-medium text-brand">Shift done</span>
          ) : !isCheckedIn ? (
            <button type="button" disabled={isLocating} onClick={() => setModeModalOpen(true)} className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[13px]">
              <FiClock className="h-4 w-4" /> {isLocating ? 'Locating…' : 'Check in'}
            </button>
          ) : (
            <button type="button" onClick={handleCheckOut} className="btn-outline inline-flex h-9 items-center gap-2 px-4 text-[13px]">
              <FiLogOut className="h-4 w-4" /> Check out
            </button>
          )}
        </div>
      </header>

      {locationError && <p className="rounded border border-warning/30 bg-warning/5 px-3 py-2 text-[13px] text-warning">{locationError}</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Present days', value: presentDays },
          { label: 'Late marks', value: lateDays },
          { label: 'Open tasks', value: pendingTasks },
          { label: 'This month', value: records.length },
        ].map((s) => (
          <div key={s.label} className="rounded border border-line bg-surface p-4">
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{s.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded border border-line bg-surface">
          <div className="border-b border-line px-4 py-3 flex justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Recent attendance</h2>
            <Link to="/attendance" className="text-[13px] text-brand">View all</Link>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">In</th>
                <th className="px-4 py-2.5 font-medium">Out</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((r, i) => (
                <tr key={r.id || i} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{r.date}</td>
                  <td className="px-4 py-3 text-muted">{r.checkIn || '—'}{r.workMode ? ` · ${r.workMode}` : ''}</td>
                  <td className="px-4 py-3 text-muted">{r.checkOut || '—'}</td>
                  <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No records yet</td></tr>}
            </tbody>
          </table>
        </section>

        <aside className="space-y-4">
          <div className="rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink">Upcoming holidays</div>
            <ul className="divide-y divide-line">
              {holidays.length === 0 ? (
                <li className="px-4 py-4 text-[13px] text-muted">None scheduled</li>
              ) : holidays.map((h) => (
                <li key={h.id || h._id} className="px-4 py-3">
                  <p className="text-[13px] font-medium text-ink">{h.name}</p>
                  <p className="text-xs text-muted">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink">Announcements</div>
            <ul className="divide-y divide-line">
              {announcements.length === 0 ? (
                <li className="px-4 py-4 text-[13px] text-muted">No announcements</li>
              ) : announcements.map((a) => (
                <li key={a._id} className="px-4 py-3">
                  <p className="text-[13px] font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.description}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-2">
              <Link to="/policies" className="text-[13px] text-brand">View all</Link>
            </div>
          </div>
        </aside>
      </div>

      {modeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4" onClick={() => setModeModalOpen(false)}>
          <div className="w-full max-w-md rounded border border-line bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Work location</h3>
              <button type="button" onClick={() => setModeModalOpen(false)} className="text-muted"><FiX /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'Office', icon: FiBriefcase, sub: 'GPS required' },
                { mode: 'Home', icon: FiHome, sub: 'Remote' },
                { mode: 'Field', icon: FiMapPin, sub: 'On site' },
              ].map(({ mode, icon: Icon, sub }) => (
                <button key={mode} type="button" onClick={() => handleMode(mode)} className="rounded border border-line p-4 text-center hover:border-brand/40 hover:bg-brand-xlight">
                  <Icon className="mx-auto h-5 w-5 text-brand" />
                  <p className="mt-2 text-[13px] font-medium text-ink">{mode}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
