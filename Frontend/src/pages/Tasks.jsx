import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiPlay, FiX, FiFlag, FiFolder, FiUser, FiCalendar } from 'react-icons/fi';
import PageShell from '../components/PageShell';
import api from '../services/api';
import { useSelector } from 'react-redux';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Pending', label: 'Pending' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Completed', label: 'Completed' },
];

const statusStyle = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-brand/10 text-brand border-brand/20',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const priorityStyle = {
  Low: 'text-muted',
  Medium: 'text-ink',
  High: 'text-orange-600',
  Urgent: 'text-rose-600',
};

const Tasks = () => {
  const user = useSelector((state) => state.auth.user || {});
  const userId = user.employeeId || user._id;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?employeeId=${encodeURIComponent(userId || '')}`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Could not load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchTasks();
  }, [userId]);

  const visible = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => ({
    all: tasks.length,
    Pending: tasks.filter((t) => t.status === 'Pending').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    Completed: tasks.filter((t) => t.status === 'Completed').length,
  }), [tasks]);

  const openTask = (task) => {
    setSelected(task);
    setCompleting(false);
    setCompletionNote(task.employeeComment || '');
  };

  const closeDetail = () => {
    setSelected(null);
    setCompleting(false);
    setCompletionNote('');
  };

  const updateStatus = async (taskId, status, extra = {}) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status, ...extra });
      setTasks((rows) => rows.map((row) => (row._id === data._id ? data : row)));
      setSelected(data);
      toast.success(status === 'Completed' ? 'Task marked complete' : status === 'In Progress' ? 'Task started' : 'Task updated');
      setCompleting(false);
      if (status === 'Completed') setCompletionNote(data.employeeComment || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleStart = () => {
    if (!selected || selected.status !== 'Pending') return;
    updateStatus(selected._id, 'In Progress', { progress: 10 });
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    updateStatus(selected._id, 'Completed', {
      progress: 100,
      employeeComment: completionNote.trim() || undefined,
    });
  };

  return (
    <PageShell title="My tasks" description="Open a task to read full instructions, then start or complete it" count={tasks.length}>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
              filter === f.id ? 'bg-brand text-white' : 'text-muted hover:bg-soft hover:text-ink'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 tabular-nums ${filter === f.id ? 'text-white/80' : 'text-muted'}`}>
              {counts[f.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        {loading ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted">
            {filter === 'all' ? 'No tasks assigned yet.' : `No ${filter.toLowerCase()} tasks.`}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((task) => (
              <li key={task._id}>
                <button
                  type="button"
                  onClick={() => openTask(task)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-soft/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{task.title}</p>
                      <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${statusStyle[task.status] || 'bg-soft text-muted'}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted">
                      {task.description?.trim() || 'No instructions added — open for details from your lead.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                      {task.projectName && <span>Project: {task.projectName}</span>}
                      <span className={priorityStyle[task.priority] || 'text-muted'}>Priority: {task.priority || 'Medium'}</span>
                      <span>Due: {task.dueDate || '—'}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] font-medium text-brand">View</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={closeDetail} />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Task details</p>
                <h2 className="mt-1 text-[17px] font-semibold text-ink">{selected.title}</h2>
                <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${statusStyle[selected.status] || 'bg-soft text-muted'}`}>
                  {selected.status}
                </span>
              </div>
              <button type="button" onClick={closeDetail} className="rounded-lg p-2 text-muted hover:bg-soft hover:text-ink">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">What to do</h3>
                <div className="mt-2 whitespace-pre-wrap rounded-lg border border-line bg-soft/40 px-3 py-3 text-[13px] leading-relaxed text-ink">
                  {selected.description?.trim() || 'No detailed instructions were added for this task. Ask your manager if anything is unclear.'}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Meta icon={FiFolder} label="Project" value={selected.projectName || 'No project'} />
                <Meta icon={FiFlag} label="Priority" value={selected.priority || 'Medium'} valueClass={priorityStyle[selected.priority]} />
                <Meta icon={FiCalendar} label="Due date" value={selected.dueDate || '—'} />
                <Meta icon={FiUser} label="Assigned by" value={selected.assignedBy || '—'} />
                <Meta icon={FiClock} label="Progress" value={`${Number(selected.progress) || 0}%`} />
              </div>

              {selected.employeeComment && selected.status === 'Completed' && (
                <section>
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">Your completion note</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-line px-3 py-3 text-[13px] text-ink">{selected.employeeComment}</p>
                </section>
              )}

              {completing && (
                <form id="complete-task-form" onSubmit={handleCompleteSubmit} className="space-y-2 rounded-lg border border-brand/20 bg-brand/5 p-3">
                  <label className="block text-[12px] font-semibold text-ink">
                    Completion note <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="What did you finish? Any blockers or links?"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                  />
                </form>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-soft/30 px-5 py-3">
              <button type="button" onClick={closeDetail} className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink hover:bg-soft">
                Close
              </button>
              {selected.status === 'Pending' && !completing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleStart}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                >
                  <FiPlay className="h-3.5 w-3.5" /> Start task
                </button>
              )}
              {selected.status !== 'Completed' && !completing && (
                <button
                  type="button"
                  onClick={() => setCompleting(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <FiCheckCircle className="h-3.5 w-3.5" /> Mark complete
                </button>
              )}
              {completing && (
                <>
                  <button type="button" onClick={() => setCompleting(false)} className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink">
                    Back
                  </button>
                  <button
                    type="submit"
                    form="complete-task-form"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <FiCheckCircle className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Confirm complete'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const Meta = ({ icon: Icon, label, value, valueClass }) => (
  <div className="rounded-lg border border-line px-3 py-2.5">
    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
      <Icon className="h-3.5 w-3.5" /> {label}
    </p>
    <p className={`mt-1 text-[13px] font-medium ${valueClass || 'text-ink'}`}>{value}</p>
  </div>
);

export default Tasks;
