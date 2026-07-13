import React, { useState, useEffect } from 'react';
import { Card } from '../../components';
import { FiPlus, FiTarget, FiCalendar, FiDollarSign, FiTrash2, FiUsers } from 'react-icons/fi';
import axios from 'axios';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client: '',
    status: 'Planning',
    deadline: '',
    budget: '',
    team: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, clientRes, empRes] = await Promise.all([
        axios.get('http://localhost:5000/api/projects', { withCredentials: true }),
        axios.get('http://localhost:5000/api/clients', { withCredentials: true }),
        axios.get('http://localhost:5000/api/employees', { withCredentials: true })
      ]);
      setProjects(projRes.data);
      setClients(clientRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/projects', formData, { withCredentials: true });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', client: '', status: 'Planning', deadline: '', budget: '', team: [] });
      fetchData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to save project: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`http://localhost:5000/api/projects/${id}`, { withCredentials: true });
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Active': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Planning': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
      case 'On Hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiTarget className="w-6 h-6 text-purple-500" />
            Project Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track and manage client projects</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FiTarget className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No projects found.</p>
            <p className="text-sm text-slate-400">Click "Create Project" to get started.</p>
          </div>
        ) : (
          projects.map(project => (
            <Card key={project._id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{project.title}</h3>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      Client: <span className="text-purple-600 dark:text-purple-400">{project.client?.company || 'Unknown Client'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    <button
                      onClick={() => deleteProject(project._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6">
                  {project.description}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" /> Deadline
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatDate(project.deadline)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" /> Budget
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      ${project.budget?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FiUsers className="w-3 h-3" /> Team Size
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {project.team?.length || 0} Members
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create New Project</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                    <input
                      required type="text" value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      required value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client</label>
                    <select
                      required value={formData.client}
                      onChange={e => setFormData({ ...formData, client: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a Client</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.company} ({c.name})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                    <input
                      required type="date" value={formData.deadline}
                      onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget ($)</label>
                    <input
                      type="number" value={formData.budget}
                      onChange={e => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Team Members</label>
                    <div className="w-full max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg space-y-2">
                      {employees.map(emp => {
                        const empId = emp.employeeId || emp._id;
                        const isChecked = formData.team.includes(empId);
                        return (
                          <label key={emp._id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormData(prev => {
                                  const current = prev.team;
                                  if (current.includes(empId)) {
                                    return { ...prev, team: current.filter(id => id !== empId) };
                                  } else {
                                    return { ...prev, team: [...current, empId] };
                                  }
                                });
                              }}
                              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-purple-600 transition-colors">
                              {emp.name} <span className="text-xs text-slate-500">({emp.designation || 'Employee'})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg shadow-purple-500/30 transition-all font-medium">Save Project</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
