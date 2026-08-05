import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const STATUS_STYLES = {
  Completed: 'bg-success/10 text-success',
  Active: 'bg-brand-xlight text-brand',
  Planning: 'bg-soft text-ink',
  'On Hold': 'bg-warning/10 text-warning',
};

const emptyForm = {
  title: '',
  description: '',
  client: '',
  status: 'Planning',
  deadline: '',
  budget: '',
  team: [],
};

const fieldError = (errors, field) => errors?.find((e) => e.field === field)?.message;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, clientRes, empRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/employees'),
      ]);
      setProjects(Array.isArray(projRes.data) ? projRes.data : []);
      setClients(Array.isArray(clientRes.data) ? clientRes.data : []);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateClientSide = () => {
    const next = [];
    const title = formData.title.trim();
    if (!title) next.push({ field: 'name', message: 'Project name is required' });
    else if (title.length > 120) next.push({ field: 'name', message: 'Name must be ≤ 120 characters' });

    if (!formData.description.trim()) {
      next.push({ field: 'description', message: 'Description is required' });
    }

    if (!formData.client) {
      next.push({ field: 'client', message: 'Client is required' });
    }

    if (!formData.deadline) {
      next.push({ field: 'deadline', message: 'Deadline is required' });
    } else {
      const d = new Date(formData.deadline);
      if (Number.isNaN(d.getTime())) {
        next.push({ field: 'deadline', message: 'Deadline must be a valid date' });
      }
    }

    if (formData.budget !== '' && formData.budget !== null && formData.budget !== undefined) {
      if (typeof formData.budget !== 'number' || !Number.isFinite(formData.budget)) {
        next.push({ field: 'budget', message: 'Budget must be a number' });
      } else if (formData.budget < 0) {
        next.push({ field: 'budget', message: 'Budget must be ≥ 0' });
      }
    }

    return next;
  };

  const handleBudgetChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setFormData((prev) => ({ ...prev, budget: '' }));
      return;
    }
    // Block non-numeric keystrokes from becoming strings in state
    if (!/^\d+(\.\d*)?$/.test(raw)) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setFormData((prev) => ({ ...prev, budget: n }));
  };

  const openModal = () => {
    setFormData(emptyForm);
    setErrors([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validateClientSide();
    if (clientErrors.length) {
      setErrors(clientErrors);
      setFormError(clientErrors[0].message);
      return;
    }

    const payload = {
      name: formData.title.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      clientId: formData.client,
      status: formData.status,
      deadline: formData.deadline,
      endDate: formData.deadline,
      budget: formData.budget === '' ? 0 : Number(formData.budget),
      team: formData.team,
    };

    if (typeof payload.budget !== 'number' || !Number.isFinite(payload.budget)) {
      setErrors([{ field: 'budget', message: 'Budget must be a number' }]);
      setFormError('Budget must be a number');
      return;
    }

    setSaving(true);
    setFormError('');
    setErrors([]);
    try {
      await api.post('/projects', payload);
      setIsModalOpen(false);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      const data = error.response?.data;
      setErrors(data?.errors || []);
      setFormError(data?.message || error.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatBudget = (budget) => {
    const n = typeof budget === 'number' ? budget : Number(String(budget || '').replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(n)) return '—';
    return `$${n.toLocaleString('en-US')}`;
  };

  const teamCount = (project) => {
    if (typeof project.teamSize === 'number') return project.teamSize;
    if (Array.isArray(project.team)) return project.team.length;
    return 0;
  };

  const toggleTeamMember = (empId) => {
    setFormData((prev) => {
      const current = prev.team;
      if (current.includes(empId)) {
        return { ...prev, team: current.filter((id) => id !== empId) };
      }
      return { ...prev, team: [...current, empId] };
    });
  };

  const inputClass = (field) =>
    `app-input h-9 text-[13px] ${fieldError(errors, field) ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`;

  return (
    <PageShell
      title="Projects"
      description="Track and manage client projects"
      count={projects.length}
      actions={
        <button
          type="button"
          onClick={openModal}
          className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]"
        >
          <FiPlus className="h-3.5 w-3.5" /> Create project
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Deadline</th>
                <th className="px-4 py-2.5 font-medium">Budget</th>
                <th className="px-4 py-2.5 font-medium">Team</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-[13px] text-muted">No projects yet.</p>
                    <button
                      type="button"
                      onClick={openModal}
                      className="mt-3 text-[13px] font-medium text-brand hover:text-brand-hover"
                    >
                      Create your first project
                    </button>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{project.title || project.name}</p>
                      {project.description && (
                        <p className="mt-0.5 text-[12px] text-muted line-clamp-1">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project.client?.company || project.client?.name || project.client || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[project.status] || 'bg-soft text-muted'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(project.deadline || project.endDate)}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatBudget(project.budget)}</td>
                    <td className="px-4 py-3 text-muted">{teamCount(project)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteProject(project._id)}
                        className="rounded p-1.5 text-muted hover:bg-soft hover:text-danger"
                        aria-label="Delete project"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded border border-line bg-surface">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <h3 className="text-[15px] font-semibold text-ink">New project</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4" noValidate>
              {formError && (
                <div className="rounded border border-danger/20 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {formError}
                </div>
              )}

              <div>
                <label className="app-label mb-1 block text-[13px]">Project name</label>
                <input
                  type="text"
                  maxLength={120}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass('name')}
                />
                {fieldError(errors, 'name') && (
                  <p className="mt-1 text-[12px] text-danger">{fieldError(errors, 'name')}</p>
                )}
              </div>

              <div>
                <label className="app-label mb-1 block text-[13px]">Description</label>
                <textarea
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`app-input min-h-[80px] resize-none text-[13px] ${
                    fieldError(errors, 'description') ? 'border-danger' : ''
                  }`}
                />
                {fieldError(errors, 'description') && (
                  <p className="mt-1 text-[12px] text-danger">{fieldError(errors, 'description')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Client</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className={inputClass('client')}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                  {fieldError(errors, 'client') && (
                    <p className="mt-1 text-[12px] text-danger">{fieldError(errors, 'client')}</p>
                  )}
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="app-input h-9 text-[13px]"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className={inputClass('deadline')}
                  />
                  {fieldError(errors, 'deadline') && (
                    <p className="mt-1 text-[12px] text-danger">{fieldError(errors, 'deadline')}</p>
                  )}
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Budget ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    value={formData.budget === '' ? '' : formData.budget}
                    onChange={handleBudgetChange}
                    className={inputClass('budget')}
                    placeholder="0"
                  />
                  {fieldError(errors, 'budget') && (
                    <p className="mt-1 text-[12px] text-danger">{fieldError(errors, 'budget')}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="app-label mb-1 block text-[13px]">Team members</label>
                <div className="max-h-36 overflow-y-auto rounded border border-line bg-soft p-2 space-y-1">
                  {employees.length === 0 ? (
                    <p className="px-1 py-2 text-[12px] text-muted">No employees available.</p>
                  ) : (
                    employees.map((emp) => {
                      const empId = String(emp.employeeId || emp._id);
                      const checked = formData.team.includes(empId);
                      return (
                        <label
                          key={emp._id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamMember(empId)}
                            className="h-3.5 w-3.5 rounded border-line text-brand focus:ring-brand/30"
                          />
                          <span className="text-[13px] text-ink">
                            {emp.name}{' '}
                            <span className="text-muted">({emp.designation || 'Employee'})</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline h-9 px-3 text-[13px]"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]" disabled={saving}>
                  {saving ? 'Saving…' : 'Save project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Projects;
