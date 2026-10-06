import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClipboard, FiLogIn, FiLogOut } from 'react-icons/fi';
import api from '../../services/api';

const TABS = ['Overview', 'Attendance', 'Leave', 'Work', 'Payroll', 'Documents', 'Timeline'];

const MonthDots = ({ attendance, leaves }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: days }, (_, index) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const row = attendance.find((item) => item.date === date);
    const onLeave = leaves.some((item) => item.status === 'Approved' && item.startDate <= date && item.endDate >= date);
    let tone = 'bg-line';
    if (onLeave) tone = 'bg-muted';
    else if (row && String(row.status || '').toLowerCase().includes('late')) tone = 'bg-warning';
    else if (row?.checkIn) tone = 'bg-brand';
    else if (row && String(row.status || '').toLowerCase().includes('absent')) tone = 'bg-danger';
    return { date, tone, known: Boolean(row || onLeave) };
  });
  return (
    <div>
      <p className="mb-2 text-[12px] text-muted">This month. Green present, yellow late, gray leave. Blank means no record.</p>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <div key={cell.date} title={cell.date} className={`h-6 rounded ${cell.known ? cell.tone : 'bg-soft'}`} />
        ))}
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[12px] text-muted">{label}</p>
    <p className="mt-0.5 text-[13px] text-ink">{value || '—'}</p>
  </div>
);

const EmployeeProfile = () => {
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: emp } = await api.get(`/employees/${id}`);
        if (cancelled) return;
        setEmployee(emp);
        const month = new Date().toISOString().slice(0, 7);
        const [att, leave, task, pay, reportPack] = await Promise.allSettled([
          api.get(`/attendance?employeeId=${emp._id}&month=${month}`),
          api.get(`/leaves?employeeId=${emp._id}`),
          api.get(`/tasks?employeeId=${encodeURIComponent(emp.employeeId)}`),
          api.get(`/payslips?employeeId=${encodeURIComponent(emp.employeeId)}`),
          api.get('/reports'),
        ]);
        if (cancelled) return;
        if (att.status === 'fulfilled') setAttendance(Array.isArray(att.value.data) ? att.value.data : []);
        if (leave.status === 'fulfilled') setLeaves(Array.isArray(leave.value.data) ? leave.value.data : []);
        if (task.status === 'fulfilled') setTasks(Array.isArray(task.value.data) ? task.value.data : []);
        if (pay.status === 'fulfilled') setPayslips(Array.isArray(pay.value.data) ? pay.value.data : []);
        if (reportPack.status === 'fulfilled' && Array.isArray(reportPack.value.data)) {
          const mine = reportPack.value.data.filter((row) => {
            const who = row.employeeId?._id || row.employeeId;
            return String(who) === String(emp._id);
          });
          setReports(mine);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load this employee');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = attendance.find((row) => row.date === today);
  const late = attendance.filter((row) => String(row.status || '').toLowerCase().includes('late')).length;
  const openTasks = tasks.filter((task) => task.status !== 'Completed');
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < today);
  const dueToday = openTasks.filter((task) => task.dueDate === today);

  const timeline = useMemo(() => {
    const rows = [
      ...attendance.flatMap((row) => [
        row.checkIn ? { at: row.createdAt || row.date, text: `Checked in${row.workMode ? ` (${row.workMode === 'Home' ? 'WFH' : row.workMode})` : ''}`, icon: 'in' } : null,
        row.checkOut ? { at: row.updatedAt || row.createdAt || row.date, text: 'Checked out', icon: 'out' } : null,
      ].filter(Boolean)),
      ...tasks.flatMap((row) => [
        { at: row.createdAt, text: `${row.assignedBy || 'Someone'} assigned “${row.title}”`, icon: 'task' },
        row.status === 'Completed' ? { at: row.updatedAt || row.createdAt, text: `Completed “${row.title}”`, icon: 'done' } : null,
      ].filter(Boolean)),
      ...reports.map((row) => ({ at: row.updatedAt || row.createdAt, text: 'Daily report updated', icon: 'report' })),
    ];
    return rows
      .filter((row) => row.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 30);
  }, [attendance, tasks, reports]);

  if (loading) return <p className="p-8 text-[13px] text-muted">Loading employee…</p>;
  if (error || !employee) {
    return (
      <div className="p-8">
        <p className="text-[13px] text-ink">{error || 'Employee not found'}</p>
        <Link to="/hrm/employees" className="mt-2 inline-block text-[13px] text-brand">Back to employees</Link>
      </div>
    );
  }

  const initials = (employee.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-[1100px] p-6 lg:p-8">
      <Link to="/hrm/employees" className="text-[13px] text-muted hover:text-ink">Employees</Link>
      {(() => {
        const completed = tasks.filter((task) => task.status === 'Completed').length;
        const pending = tasks.filter((task) => task.status !== 'Completed').length;
        const attendancePct = attendance.length ? Math.round((attendance.filter((row) => !String(row.status || '').toLowerCase().includes('absent')).length / attendance.length) * 100) : null;
        const stats = [
          { label: 'Assigned tasks', value: tasks.length },
          { label: 'Completed', value: completed },
          { label: 'Pending', value: pending },
          attendancePct !== null ? { label: 'Attendance this month', value: `${attendancePct}%` } : null,
        ].filter(Boolean);
        return (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-[12px] text-muted">{stat.label}</p>
                <p className="mt-1 text-[18px] font-semibold tabular-nums text-ink">{stat.value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      <header className="mt-4 flex flex-wrap items-start gap-4 border-b border-line pb-5">
        {employee.profilePicture ? (
          <img src={employee.profilePicture} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-soft text-[14px] font-semibold text-ink">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold text-ink">{employee.name}</h1>
          <p className="mt-1 text-[13px] text-muted">{employee.employeeId} · {employee.designation || 'No designation'} · {employee.department || 'No department'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-line px-2 py-1 text-[12px] text-ink">
            {!todayRow?.checkIn ? 'Not checked in' : todayRow.checkOut ? 'Checked out' : todayRow.workMode === 'Home' ? 'Working · WFH' : todayRow.workMode === 'Field' ? 'Working · Field' : 'Working · Office'}
          </span>
          <button type="button" onClick={() => { setDraft({ name: employee.name || '', email: employee.email || '', mobile: employee.mobile || '', department: employee.department || '', designation: employee.designation || '', reportingTo: employee.reportingTo || '', joinDate: employee.joinDate || '', branch: employee.branch || '' }); setEditing(true); }} className="h-8 rounded border border-line bg-surface px-3 text-[13px] text-ink">Edit</button>
        </div>
      </header>

      {editing && draft && (
        <form
          className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await api.put(`/employees/${employee._id}`, draft);
              const { data } = await api.get(`/employees/${employee._id}`);
              setEmployee(data);
              setEditing(false);
            } catch (err) {
              setError(err.response?.data?.message || 'Could not save employee');
            } finally {
              setSaving(false);
            }
          }}
        >
          {[
            ['name', 'Name'],
            ['email', 'Email'],
            ['mobile', 'Phone'],
            ['department', 'Department'],
            ['designation', 'Designation'],
            ['reportingTo', 'Reporting manager'],
            ['joinDate', 'Joining date'],
            ['branch', 'Work location'],
          ].map(([key, label]) => (
            <label key={key} className="text-[12px] text-muted">
              {label}
              <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="mt-1 h-9 w-full rounded border border-line px-2 text-[13px] text-ink" />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="h-8 rounded bg-brand px-3 text-[13px] text-white">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(false)} className="h-8 rounded border border-line px-3 text-[13px]">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`h-9 shrink-0 px-3 text-[13px] ${tab === name ? 'border-b-2 border-brand font-medium text-ink' : 'text-muted'}`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="py-5">
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Employee ID" value={employee.employeeId} />
            <Field label="Email" value={employee.email} />
            <Field label="Phone" value={employee.mobile} />
            <Field label="Department" value={employee.department} />
            <Field label="Designation" value={employee.designation} />
            <Field label="Reporting manager" value={employee.reportingTo} />
            <Field label="Joining date" value={employee.joinDate} />
            <Field label="Work location" value={employee.branch} />
          </div>
        )}

        {tab === 'Attendance' && (
          <div className="space-y-4">
            <MonthDots attendance={attendance} leaves={leaves} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Today" value={todayRow ? `${todayRow.checkIn || '—'} – ${todayRow.checkOut || 'working'}` : 'No check-in'} />
              <Field label="Days this month" value={String(attendance.length)} />
              <Field label="Late marks" value={String(late)} />
            </div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">In</th>
                  <th className="py-2 font-medium">Out</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 && <tr><td colSpan={4} className="py-6 text-muted">No attendance this month.</td></tr>}
                {attendance.map((row) => (
                  <tr key={row._id || row.date} className="border-b border-line">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2">{row.checkIn || '—'}</td>
                    <td className="py-2">{row.checkOut || '—'}</td>
                    <td className="py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Leave' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Applied" value={String(leaves.length)} />
              <Field label="Approved" value={String(leaves.filter((row) => row.status === 'Approved').length)} />
            </div>
            {leaves.length === 0 && <p className="text-[13px] text-muted">No leave requests.</p>}
            <ul className="divide-y divide-line rounded-lg border border-line">
              {leaves.map((row) => (
                <li key={row._id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span>{row.type} · {row.startDate} to {row.endDate}</span>
                  <span className="text-muted">{row.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'Work' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Field label="Open tasks" value={String(openTasks.length)} />
              <Field label="Today's due" value={String(dueToday.length)} />
              <Field label="Overdue" value={String(overdue.length)} />
              <Field label="Completion" value={tasks.length ? `${Math.round((tasks.filter((task) => task.status === 'Completed').length / tasks.length) * 100)}%` : '—'} />
              <Field label="Completed this week" value={String(tasks.filter((task) => {
                if (task.status !== 'Completed' || !task.updatedAt) return false;
                const updated = new Date(task.updatedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return updated >= weekAgo;
              }).length)} />
            </div>
            {tasks.length === 0 && <p className="text-[13px] text-muted">No tasks assigned to this employee ID.</p>}
            <ul className="divide-y divide-line rounded-lg border border-line">
              {tasks.map((task) => (
                <li key={task._id} className="px-3 py-2 text-[13px]">
                  <p className="text-ink">{task.title}</p>
                  <p className="text-muted">{task.projectName || 'No project'} · {task.status} · due {task.dueDate}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'Payroll' && (
          <div>
            {payslips.length === 0 && <p className="text-[13px] text-muted">No payslips for this employee.</p>}
            <ul className="divide-y divide-line rounded-lg border border-line">
              {payslips.map((slip) => (
                <li key={slip._id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span>{slip.month}</span>
                  <span className="text-muted">{slip.status} · ₹{Number(slip.netPay || 0).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'Documents' && (
          <p className="text-[13px] text-muted">Identity files such as Aadhaar, PAN, and offer letters are not stored on the employee record yet. Upload stays on the Documents module.</p>
        )}

        {tab === 'Timeline' && (
          <ul className="divide-y divide-line">
            {timeline.length === 0 && <li className="py-4 text-[13px] text-muted">No activity yet.</li>}
            {timeline.map((row, index) => {
              const Icon = row.icon === 'in' ? FiLogIn : row.icon === 'out' ? FiLogOut : row.icon === 'done' ? FiCheckCircle : FiClipboard;
              const when = new Date(row.at);
              const label = Number.isNaN(when.getTime()) ? String(row.at) : when.toLocaleString('en-IN');
              return (
                <li key={index} className="flex gap-3 py-3 text-[13px]">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <div>
                    <p className="text-ink">{row.text}</p>
                    <p className="text-[12px] text-muted">{label}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
