import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClock, FiLogOut, FiBriefcase, FiHome, FiMapPin, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useSelector } from 'react-redux';

// Gali Number 2, Punjab National Bank, Hoshiyarpur, Sector 51, Noida
const OFFICE_LAT = 28.579126;
const OFFICE_LON = 77.363649;
const ALLOWED_RADIUS_METERS = 300;

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
  const [dueToday, setDueToday] = useState(0);
  const [openTasks, setOpenTasks] = useState([]);
  const [leavePending, setLeavePending] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCompletedShift, setHasCompletedShift] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [reportPrompt, setReportPrompt] = useState(false);
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
    const today = localToday();

    const load = async () => {
      try {
        const [attRes, holRes, annRes, taskRes, leaveRes] = await Promise.all([
          api.get(`/attendance?employeeId=${userId}`),
          api.get('/holidays'),
          api.get('/announcements'),
          api.get(`/tasks?employeeId=${user.employeeId || userId}`),
          api.get(`/leaves?employeeId=${user._id || userId}`).catch(() => ({ data: [] })),
        ]);

        const pendingRaw = localStorage.getItem('pendingCheckIn');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
        const serverToday = (attRes.data || []).find((row) => row.date === today);
        if (serverToday?.checkIn) {
          localStorage.removeItem('pendingCheckIn');
          setRecords(attRes.data);
          if (serverToday.checkOut) setHasCompletedShift(true);
          else setIsCheckedIn(true);
        } else if (pending?.date === today && pending.checkIn) {
          setIsCheckedIn(true);
          setRecords([pending, ...attRes.data]);
          api.post('/attendance/checkin', {
            employeeId: userId,
            date: pending.date,
            checkIn: pending.checkIn,
            status: pending.status,
            workMode: pending.workMode,
            latitude: pending.latitude,
            longitude: pending.longitude,
            accuracy: pending.accuracy,
            distanceFromOffice: pending.distanceFromOffice,
          }).then((res) => {
            localStorage.removeItem('pendingCheckIn');
            setRecords((rows) => rows.map((row) => (row.date === today ? res.data : row)));
          }).catch(() => {});
        } else {
          setRecords(attRes.data);
        }

        const future = holRes.data
          .filter((h) => new Date(h.date) >= new Date(new Date().toDateString()))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setHolidays(future);
        setAnnouncements(annRes.data.slice(0, 3));
        const open = (taskRes.data || []).filter((t) => t.status !== 'Completed');
        setPendingTasks(open.length);
        setOpenTasks(open);
        setDueToday(open.filter((t) => t.dueDate === today).length);
        setLeavePending((leaveRes.data || []).filter((row) => row.status === 'Pending').length);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [userId, user.employeeId]);

  const performCheckIn = async (mode, gps = null) => {
    const today = localToday();
    const already = records.find((row) => row.date === today);
    if (already?.checkIn || isCheckedIn) {
      toast.error(already?.checkOut ? 'Already checked out today' : 'Already checked in today');
      return;
    }
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 15);
    const pending = {
      id: `pending-${Date.now()}`,
      date: today,
      checkIn: timeStr,
      status: isLate ? 'Late (Active)' : 'Present (Active)',
      workMode: mode,
      latitude: gps?.latitude ?? null,
      longitude: gps?.longitude ?? null,
      accuracy: gps?.accuracy ?? null,
      distanceFromOffice: gps?.distanceFromOffice ?? null,
    };
    try {
      const res = await api.post('/attendance/checkin', {
        employeeId: userId,
        date: today,
        checkIn: timeStr,
        workMode: mode,
        latitude: pending.latitude,
        longitude: pending.longitude,
        accuracy: pending.accuracy,
        distanceFromOffice: pending.distanceFromOffice,
      });
      localStorage.removeItem('pendingCheckIn');
      setRecords([res.data, ...records.filter((row) => row.date !== today)]);
      setIsCheckedIn(true);
      toast.success(isLate
        ? `Checked in at ${timeStr}. Saved. Checkout opens at 6:30 PM.`
        : `Checked in at ${timeStr}. Saved. This shift stays open until 6:30 PM.`);
    } catch (error) {
      const unauthorized = error.response?.status === 401;
      if (unauthorized) {
        toast.error('Session expired. Sign in again, then check in. This check-in was not saved.');
        return;
      }
      toast.error(error.response?.data?.message || 'Check-in was not saved. Try again.');
    }
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
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        if (mode === 'Office') {
          const d = calculateDistance(OFFICE_LAT, OFFICE_LON, lat, lon);
          if (!Number.isFinite(accuracy) || accuracy > ALLOWED_RADIUS_METERS) {
            const message = `GPS is only accurate to about ${Math.round(accuracy || 0)}m. Stand near a window and try Office check-in again.`;
            setLocationError(message);
            toast.error(message);
            return;
          }
          if (d > ALLOWED_RADIUS_METERS) {
            const message = `You are ${Math.round(d)}m from the office. Office check-in works only within ${ALLOWED_RADIUS_METERS}m. Use Home or Field if you are away.`;
            setLocationError(message);
            toast.error(message);
            return;
          }
          performCheckIn('Office', { latitude: lat, longitude: lon, accuracy, distanceFromOffice: d });
        } else performCheckIn('Field', { latitude: lat, longitude: lon, accuracy });
      },
      () => {
        setIsLocating(false);
        const message = 'Location was blocked. Allow GPS for this site, then try Office check-in again.';
        setLocationError(message);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const shiftStillOpen = now.getHours() < 18 || (now.getHours() === 18 && now.getMinutes() < 30);

  const handleCheckOut = async () => {
    if (shiftStillOpen) {
      toast.error('Checkout stays closed until 6:30 PM. One check-in covers the full shift.');
      return;
    }
    const today = localToday();
    const pending = localStorage.getItem('pendingCheckIn');
    if (!pending) return toast.error('Check in first. There is no open shift to close.');
    const p = JSON.parse(pending);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const reports = await api.get('/reports/my');
      const hasReport = (reports.data || []).some((row) => row.date === today);
      if (!hasReport) {
        setReportPrompt(true);
        return;
      }
      const res = await api.post('/attendance/checkin', {
        employeeId: userId,
        date: today,
        checkIn: p.checkIn,
        checkOut: timeStr,
        workMode: p.workMode,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.accuracy,
        distanceFromOffice: p.distanceFromOffice,
      });
      localStorage.removeItem('pendingCheckIn');
      setRecords(records.map((r) => (r.date === today ? res.data : r)));
      setIsCheckedIn(false);
      setHasCompletedShift(true);
      const mins = res.data.workedMinutes;
      const hoursLabel = Number.isFinite(mins) ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m` : '';
      const note = res.data.status === 'Half Day'
        ? 'Marked Half Day because checkout is before 6:30 PM.'
        : res.data.status === 'Late'
          ? 'Marked Late. You stayed till the end, but checked in after 10:15 AM.'
          : 'Full day recorded.';
      toast.success(`${res.data.status || 'Checked out'}${hoursLabel ? ` · ${hoursLabel}` : ''}. ${note}`);
    } catch (error) {
      if (error.response?.data?.message === 'MISSING_REPORT') {
        setReportPrompt(true);
      } else toast.error(error.response?.data?.message || 'Checkout failed');
    }
  };

  const lateDays = records.filter((r) => r.status?.includes('Late')).length;
  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const todayKey = localToday();
  const todayRow = records.find((row) => row.date === todayKey);
  const place = todayRow?.workMode === 'Home' ? 'Working from home' : todayRow?.workMode === 'Field' ? 'On field' : 'At office';
  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const statusLine = !todayRow?.checkIn
    ? 'Not checked in'
    : todayRow.checkOut
      ? `Checked out · ${todayRow.status || 'Done'}${Number.isFinite(todayRow.workedMinutes) ? ` · ${Math.floor(todayRow.workedMinutes / 60)}h ${String(todayRow.workedMinutes % 60).padStart(2, '0')}m` : ''}`
      : `${place} · in at ${todayRow.checkIn}`;
  const prettyDate = (value) => {
    if (!value) return '—';
    const [y, m, day] = String(value).slice(0, 10).split('-');
    if (!y || !m || !day) return String(value);
    return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-full space-y-4">
      <header className="flex flex-col gap-4 border border-line bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">{todayLabel}</p>
          <h1 className="mt-0.5 text-[18px] font-semibold text-ink">{hello}, {firstName}</h1>
          <p className="mt-1 text-[13px] text-muted">{statusLine}</p>
          <p className="mt-1 text-[13px] text-muted">Shift 10:15 AM – 6:30 PM · Lunch 1:30 PM – 2:15 PM</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[15px] tabular-nums text-ink">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {hasCompletedShift ? (
            <span className="bg-brand-xlight px-3 py-2 text-[13px] font-medium text-brand">Shift complete</span>
          ) : !isCheckedIn ? (
            <button type="button" disabled={isLocating} onClick={() => setModeModalOpen(true)} className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[13px]">
              <FiClock className="h-4 w-4" /> {isLocating ? 'Locating…' : 'Check in'}
            </button>
          ) : shiftStillOpen ? (
            <span className="border border-line bg-soft px-3 py-2 text-[13px] text-ink">Checked in · out at 6:30 PM</span>
          ) : (
            <button type="button" onClick={handleCheckOut} className="btn-outline inline-flex h-9 items-center gap-2 px-4 text-[13px]">
              <FiLogOut className="h-4 w-4" /> Check out
            </button>
          )}
        </div>
      </header>

      {locationError && (
        <div className="border border-warning/40 bg-warning/10 px-4 py-3 text-[13px] text-ink">
          <p className="font-medium">Office check-in needs a better location</p>
          <p className="mt-1 text-ink/80">{locationError}</p>
        </div>
      )}

      {reportPrompt && (
        <div className="border border-line bg-surface px-4 py-3">
          <p className="text-[14px] font-medium text-ink">Daily report is required before checkout</p>
          <p className="mt-1 text-[13px] text-muted">Save today’s work report, then come back and check out.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => navigate('/daily-reports')} className="h-8 bg-brand px-3 text-[13px] text-white">Write daily report</button>
            <button type="button" onClick={() => setReportPrompt(false)} className="h-8 border border-line px-3 text-[13px]">Not now</button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Due today', value: dueToday },
          { label: 'Open tasks', value: pendingTasks },
          { label: 'Leave waiting', value: leavePending },
          { label: 'Late days', value: lateDays },
        ].map((s) => (
          <div key={s.label} className="border border-line bg-surface px-4 py-3">
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{s.value}</p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">Tasks</h2>
            <Link to="/tasks" className="text-[13px] text-brand">View all</Link>
          </div>
          {openTasks.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted">Nothing open.</p>
          ) : (
            <ul>
              {openTasks.slice(0, 6).map((task) => (
                <li key={task._id} className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{task.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted">Due {prettyDate(task.dueDate)}</p>
                  </div>
                  <span className="shrink-0 bg-soft px-2 py-0.5 text-[12px] text-ink">{task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">Attendance</h2>
            <Link to="/attendance" className="text-[13px] text-brand">View all</Link>
          </div>
          <ul>
            {records.length === 0 ? (
              <li className="px-4 py-6 text-[13px] text-muted">No check-ins yet.</li>
            ) : records.slice(0, 5).map((r, i) => (
              <li key={r.id || i} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-ink">{prettyDate(r.date)}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{r.checkIn || '—'}{r.checkOut ? ` – ${r.checkOut}` : ''}</p>
                </div>
                <span className="bg-soft px-2 py-0.5 text-[12px] text-ink">{r.workMode || r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <section className="border border-line bg-surface">
          <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold text-ink">Holidays</h2>
          <ul>
            {holidays.length === 0 ? (
              <li className="px-4 py-6 text-[13px] text-muted">No upcoming holidays.</li>
            ) : holidays.slice(0, 4).map((h) => (
              <li key={h.id || h._id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                <p className="text-[13px] font-medium text-ink">{h.name}</p>
                <p className="text-[13px] text-muted">{prettyDate(h.date)}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">Announcements</h2>
            <Link to="/policies" className="text-[13px] text-brand">View all</Link>
          </div>
          <ul>
            {announcements.length === 0 ? (
              <li className="px-4 py-6 text-[13px] text-muted">Nothing new.</li>
            ) : announcements.slice(0, 3).map((a) => (
              <li key={a._id} className="border-b border-line px-4 py-3 last:border-0">
                <p className="text-[13px] font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{a.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {modeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4" onClick={() => setModeModalOpen(false)}>
          <div className="w-full max-w-md rounded border border-line bg-surface p-5 shadow-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">Where are you working?</h3>
              <button type="button" onClick={() => setModeModalOpen(false)} className="rounded p-1 text-muted hover:bg-soft" aria-label="Close"><FiX /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'Office', icon: FiBriefcase, sub: 'Within 300m' },
                { mode: 'Home', icon: FiHome, sub: 'Remote' },
                { mode: 'Field', icon: FiMapPin, sub: 'On site' },
              ].map(({ mode, icon: Icon, sub }) => (
                <button key={mode} type="button" onClick={() => handleMode(mode)} className="rounded border border-line px-2 py-4 text-center transition hover:border-brand/40 hover:bg-brand-xlight">
                  <Icon className="mx-auto h-5 w-5 text-brand" />
                  <p className="mt-2 text-[13px] font-medium text-ink">{mode}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
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
