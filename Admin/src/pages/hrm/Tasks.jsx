import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { id: taskId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectName: '',
    assignedTo: [],
    dueDate: '',
    priority: 'Medium',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, employeesRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data);
      if (taskId) {
        const match = tasksRes.data.find((task) => task._id === taskId);
        if (match) setSelected(match);
      }
      setEmployees(employeesRes.data);
      setProjects(projectsRes.data.filter(p => p.status === 'Active'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/tasks', {
        ...formData,
        assignedBy: adminInfo.name || 'Admin',
        assignerRole: adminInfo.role || 'Admin'
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', projectName: '', assignedTo: [], dueDate: '', priority: 'Medium' });
      toast.success('Task assigned successfully!');
      fetchData(); // refresh list
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleDeleteTask = (taskId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-ink">Are you sure you want to delete this task?</p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(taskId);
            }}
            className="px-4 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-hover text-sm font-medium transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1.5 bg-white bg-white/10 text-ink text-ink rounded-lg hover:bg-white/90 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const saveTask = async (patch) => {
    if (!selected) return;
    try {
      const { data } = await api.put(`/tasks/${selected._id}`, patch);
      setSelected(data);
      setTasks((rows) => rows.map((row) => (row._id === data._id ? data : row)));
      toast.success('Task updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update task');
    }
  };

  const executeDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchData(); // refresh list
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-brand/10 text-brand';
      case 'In Progress': return 'bg-brand/10 text-brand bg-brand/15 text-brand';
      case 'Pending': return 'bg-brand/10 text-brand';
      default: return 'bg-white text-ink bg-surface text-muted';
    }
  };

  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleTasks = tasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.employeeId === empId || e._id === empId);
    return emp ? emp.name : empId;
  };

  return (
    <PageShell
      title="Tasks"
      description="Assign and track work across the team"
      count={tasks.length}
      actions={
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Assign task
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface/40 text-sm text-muted text-muted uppercase tracking-wider">
                <th className="p-4 font-semibold">Task</th>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Assignee</th>
                <th className="p-4 font-semibold">Due</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted">No tasks assigned yet.</td>
                </tr>
              ) : visibleTasks.map((task) => (
                <tr key={task._id} className="hover:bg-white hover:bg-surface/40 transition-colors">
                  <td className="p-4">
                    <button type="button" onClick={() => setSelected(task)} className="text-left font-medium text-ink hover:text-brand">{task.title}</button>
                  </td>
                  <td className="p-4 text-sm text-muted">{task.projectName || '—'}</td>
                  <td className="p-4 text-sm text-ink">{getEmployeeName(task.assignedTo)}</td>
                  <td className="p-4 text-sm text-muted">{task.dueDate}</td>
                  <td className="p-4 text-sm text-ink">{task.priority || 'Medium'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
        <span>{tasks.length} tasks</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="h-8 rounded border border-line bg-surface px-3 disabled:opacity-40">Previous</button>
          <span>{safePage} / {pageCount}</span>
          <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((n) => n + 1)} className="h-8 rounded border border-line bg-surface px-3 disabled:opacity-40">Next</button>
        </div>
      </div>

      {selected && (
        <section className="mt-4 rounded border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">{selected.title}</h2>
              <p className="mt-1 text-[13px] text-muted">{selected.projectName || 'No project'} · {getEmployeeName(selected.assignedTo)} · due {selected.dueDate}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-[13px] text-muted">Close</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-[12px] text-muted">Status
              <select value={selected.status} onChange={(e) => saveTask({ status: e.target.value })} className="mt-1 h-9 w-full rounded border border-line bg-surface px-2 text-[13px] text-ink">
                {['Pending', 'In Progress', 'Completed'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-[12px] text-muted">Priority
              <select value={selected.priority || 'Medium'} onChange={(e) => saveTask({ priority: e.target.value })} className="mt-1 h-9 w-full rounded border border-line bg-surface px-2 text-[13px] text-ink">
                {['Low', 'Medium', 'High', 'Urgent'].map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label className="text-[12px] text-muted">Progress {selected.progress || 0}%
              <input type="range" min="0" max="100" value={selected.progress || 0} onChange={(e) => setSelected({ ...selected, progress: Number(e.target.value) })} onMouseUp={(e) => saveTask({ progress: Number(e.target.value) })} className="mt-2 w-full" />
            </label>
          </div>
          {selected.description && <p className="mt-4 text-[13px] text-ink">{selected.description}</p>}
          <label className="mt-4 block text-[12px] text-muted">Comment
            <textarea value={selected.employeeComment || ''} onChange={(e) => setSelected({ ...selected, employeeComment: e.target.value })} onBlur={() => saveTask({ employeeComment: selected.employeeComment || '' })} className="mt-1 w-full rounded border border-line p-2 text-[13px] text-ink" rows={3} />
          </label>
        </section>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-ink">Assign task</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Task Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line border-line rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="e.g. Update Client Presentation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line rounded-lg"
                  >
                    {['Low', 'Medium', 'High', 'Urgent'].map((level) => <option key={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line border-line rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand h-24 resize-none"
                    placeholder="Detailed instructions..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Project (Optional)</label>
                  <select
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line border-line rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-2">Assign To (Select multiple)</label>
                  <div className="w-full max-h-40 overflow-y-auto p-3 bg-surface border border-line border-line rounded-lg space-y-2">
                    {employees.filter(emp => {
                      const role = (adminInfo.role || '').toLowerCase().trim();
                      const dept = (emp.department || '').toLowerCase().trim();
                      if (role === 'founder') return true;
                      if (dept === 'software' || dept === 'engineering') return role === 'manager';
                      if (dept === 'hr') return false; // Only founder can assign to HR, and they already returned true above
                      return true;
                    }).map(emp => {
                      const empId = emp.employeeId || emp._id;
                      const isChecked = formData.assignedTo.includes(empId);
                      return (
                        <label key={emp._id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFormData(prev => {
                                const current = prev.assignedTo;
                                if (current.includes(empId)) {
                                  return { ...prev, assignedTo: current.filter(id => id !== empId) };
                                } else {
                                  return { ...prev, assignedTo: [...current, empId] };
                                }
                              });
                            }}
                            className="w-4 h-4 text-brand border-line rounded focus:ring-brand/30"
                          />
                          <span className="text-sm text-ink text-muted group-hover:text-brand/90 transition-colors">
                            {emp.name} <span className="text-xs text-muted">({emp.designation || 'Employee'})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-line border-line rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-line pt-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline h-9 px-3 text-[13px]">Cancel</button>
                  <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Assign</button>
                </div>
              </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Tasks;
