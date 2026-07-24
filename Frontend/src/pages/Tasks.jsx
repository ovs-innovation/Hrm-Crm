import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Tasks = () => {
  const user = useSelector((state) => state.auth.user || {});
  const userId = user.employeeId || user._id;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?employeeId=${userId}`);
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [userId]);

  const updateStatus = async (taskId, status) => {
    let payload = { status };
    if (status === 'Completed') {
      const comment = window.prompt('Add a completion note (optional):');
      if (comment) payload.employeeComment = comment;
    }
    try {
      await api.put(`/tasks/${taskId}`, payload);
      toast.success('Task updated');
      fetchTasks();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <PageShell title="My tasks" description="Work assigned to you" count={tasks.length}>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Task</th>
              <th className="px-4 py-2.5 font-medium">Project</th>
              <th className="px-4 py-2.5 font-medium">Due</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No tasks assigned.</td></tr>
            ) : tasks.map((task) => (
              <tr key={task._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{task.description}</p>
                </td>
                <td className="px-4 py-3 text-muted">{task.projectName || '—'}</td>
                <td className="px-4 py-3 text-muted">{task.dueDate || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{task.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {task.status === 'Pending' && (
                    <button type="button" onClick={() => updateStatus(task._id, 'In Progress')} className="mr-2 text-[13px] font-medium text-brand">Start</button>
                  )}
                  {task.status !== 'Completed' && (
                    <button type="button" onClick={() => updateStatus(task._id, 'Completed')} className="text-[13px] font-medium text-brand">Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default Tasks;
