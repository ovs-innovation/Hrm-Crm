import React, { useState, useEffect } from 'react';
import api, { getFileUrl } from '../services/api';
import { FiPlus, FiBriefcase, FiTrash2, FiClock, FiCheckCircle } from 'react-icons/fi';
import { Card, Button } from '../components';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useSelector(state => state.auth.user || {});
  const role = (user.role || '').toLowerCase().trim();
  const isManagement = role === 'founder' || role === 'manager' || role === 'hr';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    technologies: '',
    projectType: 'New Development',
    priority: 'Medium',
    budget: '',
    status: 'Active',
    startDate: '',
    endDate: ''
  });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      fetchProjects();
      setIsModalOpen(false);
      setFormData({
        name: '', description: '', client: '', technologies: '', projectType: 'New Development', priority: 'Medium', budget: '', status: 'Active', startDate: '', endDate: ''
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error creating project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30';
      case 'Completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30';
      case 'On Hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <FiBriefcase className="w-5 h-5" />
            </div>
            Projects
          </h1>
          <p className="text-slate-500 text-sm mt-1">View company projects and active teams.</p>
        </div>
        {isManagement && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2">
            <FiPlus /> New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-slate-500 py-10">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 py-10">No projects found. Create one to get started!</div>
        ) : (
          projects.map((project) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-6 group relative overflow-hidden"
            >
              {isManagement && (
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStyle(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${project.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                    project.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                  }`}>
                  {project.priority || 'Medium'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{project.name}</h3>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">{project.projectType || 'New Development'}</p>

              {(project.client || project.technologies) && (
                <div className="text-sm font-medium text-slate-500 mb-3 space-y-1">
                  {project.client && <p>Client: {project.client}</p>}
                  {project.technologies && <p>Tech Stack: {project.technologies}</p>}
                </div>
              )}

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                {project.description || 'No description provided.'}
              </p>

              {/* Team Members */}
              <div className="mb-6 h-8">
                {project.team && project.team.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((emp, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300" title={emp.name}>
                          {emp.profilePicture ? (
                            <img src={getFileUrl(emp.profilePicture)} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                          ) : emp.name.charAt(0)}
                        </div>
                      ))}
                      {project.team.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{project.team.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 ml-1">{project.team.length} member{project.team.length !== 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No assigned members</span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5" />
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                </div>
                {project.endDate && (
                  <div className="flex items-center gap-1.5">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    {new Date(project.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiBriefcase className="text-indigo-500" />
                  Create New Project
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                    <input
                      type="text" required
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Mobile App Redesign"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Client (Optional)</label>
                    <input
                      type="text"
                      value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Technology Stack</label>
                    <input
                      type="text"
                      value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. MERN Stack, React Native"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Project Type</label>
                    <select
                      value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="New Development">New Development</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Bug Fixes">Bug Fixes</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Internal">Internal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select
                      value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Budget (Optional)</label>
                    <input
                      type="text"
                      value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. $10,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of the project..."
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold">Cancel</button>
                  <Button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30">
                    Create Project
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
