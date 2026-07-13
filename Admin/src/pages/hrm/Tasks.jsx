import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components';
import { FiPlus, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
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
        axios.get('http://localhost:5000/api/tasks', { withCredentials: true }),
        axios.get('http://localhost:5000/api/employees', { withCredentials: true }),
        axios.get('http://localhost:5000/api/projects', { withCredentials: true })
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
      await axios.post('http://localhost:5000/api/tasks', {
        ...formData,
        assignedBy: adminInfo.name || 'Admin',
        assignerRole: adminInfo.role || 'Admin'
      }, { withCredentials: true });
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
        <p className="font-medium text-slate-800 dark:text-white">Are you sure you want to delete this task?</p>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(taskId);
            }}
            className="px-4 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-sm font-medium transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const executeDelete = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, { withCredentials: true });
      toast.success('Task deleted successfully');
      fetchData(); // refresh list
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.employeeId === empId || e._id === empId);
    return emp ? emp.name : empId;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Task Report</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assign tasks and track employee progress</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <FiPlus className="w-4 h-4" />
          Assign New Task
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4 font-semibold">Task Title</th>
                <th className="p-4 font-semibold">Assigned To</th>
                <th className="p-4 font-semibold">Due Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Employee Comment</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No tasks assigned yet.</td>
                </tr>
              ) : tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <h4 className="text-slate-800 dark:text-slate-200 font-medium">{task.title}</h4>
                    {task.projectName && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded">
                        {task.projectName}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {getEmployeeName(task.assignedTo)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-4 h-4 text-slate-400" />
                      {task.dueDate}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400 italic">
                    {task.employeeComment || '--'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
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
      </Card>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Assign Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Update Client Presentation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                    placeholder="Detailed instructions..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project (Optional)</label>
                  <select
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign To (Select multiple)</label>
                  <div className="w-full max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg space-y-2">
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
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                            {emp.name} <span className="text-xs text-slate-500">({emp.designation || 'Employee'})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors">Assign Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
