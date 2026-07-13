import React, { useState, useEffect } from 'react';
import { Card } from '../components';
import { FiClock, FiCheckCircle, FiBriefcase } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Tasks = () => {
  const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3072/api').replace('/api', '');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (!user) return;
      // Admin saves task using employeeId (like EMP101), so prefer that first!
      const userId = user.employeeId || user._id;

      const [tasksRes, projectsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tasks?employeeId=${userId}`, { withCredentials: true }),
        axios.get('http://localhost:5000/api/projects', { withCredentials: true })
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      let payload = { status: newStatus };
      if (newStatus === 'Completed') {
        const comment = prompt('Any notes or comments about this task?');
        if (comment) payload.employeeComment = comment;
      }

      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, payload);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'Low': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Tasks</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">View and update your assigned tasks</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center p-8 text-slate-500">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-500">
            You have no tasks assigned right now. Great job!
          </div>
        ) : (
          tasks.map(task => (
            <Card key={task._id} className="p-6 transition-all hover:shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{task.title}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-xs font-medium text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      Assigned by: <span className="text-slate-700 dark:text-slate-300 font-bold">{task.assignedBy}</span> 
                      {task.assignerRole && ` (${task.assignerRole})`}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 whitespace-pre-line">
                    {task.description}
                  </p>
                  
                  {task.projectName && task.projectName !== 'General' && (
                    <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl p-3 mb-6 border border-indigo-100 dark:border-indigo-500/10">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <FiBriefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Project</p>
                          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{task.projectName}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const proj = projects.find(p => p.name === task.projectName);
                          if (proj) setSelectedProject(proj);
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                      >
                        View Project Details
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-4 h-4 text-slate-400" />
                      Due: <span className="text-slate-700 dark:text-slate-300">{task.dueDate}</span>
                    </div>
                  </div>
                  
                  {task.employeeComment && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm italic text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                      " {task.employeeComment} "
                    </div>
                  )}
                </div>

                {task.status !== 'Completed' && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {task.status === 'Pending' && (
                      <button 
                        onClick={() => updateStatus(task._id, 'In Progress')}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl text-sm font-bold transition-colors"
                      >
                        Start Task
                      </button>
                    )}
                    <button 
                      onClick={() => updateStatus(task._id, 'Completed')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-colors"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Mark Completed
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <FiBriefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedProject.name}</h3>
                </div>
                <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest">{selectedProject.projectType || 'New Development'}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <span className="block text-xs font-bold text-slate-400 mb-1">Status</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedProject.status}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <span className="block text-xs font-bold text-slate-400 mb-1">Priority</span>
                <span className={`text-sm font-bold ${
                  selectedProject.priority === 'High' ? 'text-rose-500' : 
                  selectedProject.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                }`}>{selectedProject.priority || 'Medium'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <span className="block text-xs font-bold text-slate-400 mb-1">Tech Stack</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedProject.technologies || 'N/A'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <span className="block text-xs font-bold text-slate-400 mb-1">Client</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedProject.client || 'Internal'}</span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Project Description</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedProject.description || 'No detailed description available for this project.'}
              </p>
            </div>

            {selectedProject.team && selectedProject.team.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Assigned Team Members ({selectedProject.team.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProject.team.map((emp, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 overflow-hidden shrink-0">
                        {emp.profilePicture ? (
                          <img src={`${backendBaseUrl}${emp.profilePicture}`} alt={emp.name} className="w-full h-full object-cover" />
                        ) : emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.designation || 'Employee'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
