import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PageShell from '../../components/PageShell';
import { FiPlus, FiClock, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectName: '',
    assignedTo: [],
    dueDate: '',
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
      setFormData({ title: '', description: '', projectName: '', assignedTo: [], dueDate: '' });
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
                <th className="p-4 font-semibold">Task Title</th>
                <th className="p-4 font-semibold">Assigned To</th>
                <th className="p-4 font-semibold">Due Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Employee Comment</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">No tasks assigned yet.</td>
                </tr>
              ) : tasks.map((task) => (
                <tr key={task._id} className="hover:bg-white hover:bg-surface/40 transition-colors">
                  <td className="p-4">
                    <h4 className="text-ink font-medium">{task.title}</h4>
                    {task.projectName && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded">
                        {task.projectName}
                      </span>
                    )}
                    <p className="text-xs text-muted mt-1 line-clamp-1">{task.description}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-ink text-muted">
                    {getEmployeeName(task.assignedTo)}
                  </td>
                  <td className="p-4 text-sm text-muted text-muted">
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-4 h-4 text-muted" />
                      {task.dueDate}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted italic">
                    {task.employeeComment || '--'}
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
                  <label className="block text-sm font-medium text-ink text-muted mb-1">Description</label>
                  <textarea
                    required
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
