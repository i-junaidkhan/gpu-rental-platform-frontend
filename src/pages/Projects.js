import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, RefreshCw, Edit, Trash2, X, Save, Cpu, HardDrive, Users, Activity } from 'lucide-react';
import { getProjects, createProject, updateProject, deleteProject, getProjectSummary } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const zeroSummary = (project) => ({
  project_id: project?.id,
  project_name: project?.name,
  max_gpu_count: project?.max_gpu_count ?? 0,
  gpu_used: 0,
  gpu_available: project?.max_gpu_count === 0 ? null : project?.max_gpu_count ?? 0,
  max_storage_gb: project?.max_storage_gb ?? 0,
  storage_allocated_gb: 0,
  storage_available_gb: project?.max_storage_gb === 0 ? null : project?.max_storage_gb ?? 0,
  users_count: 0,
  active_instances_count: 0,
});

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_gpu_count: 0,
    max_storage_gb: 0
  });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      setRefreshing(true);
      const response = await getProjects();
      const projectData = asArray(response.data, 'projects');
      setProjects(projectData);

      const summaryPairs = await Promise.all(projectData.map(async (project) => {
        try {
          const res = await getProjectSummary(project.id);
          return [project.id, res.data];
        } catch (e) {
          console.error(`Failed to fetch summary for project ${project.id}`, e);
          return [project.id, zeroSummary(project)];
        }
      }));
      setSummaries(Object.fromEntries(summaryPairs));
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', max_gpu_count: 0, max_storage_gb: 0 });
    setFormError('');
    setFormSuccess('');
  };

  const openAddModal = () => { resetForm(); setShowAddModal(true); };
  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      max_gpu_count: Number(project.max_gpu_count || 0),
      max_storage_gb: Number(project.max_storage_gb || 0)
    });
    setFormError('');
    setShowEditModal(true);
  };
  const openDeleteModal = (project) => { setSelectedProject(project); setShowDeleteModal(true); };

  const cleanPayload = () => ({
    name: formData.name.trim(),
    description: formData.description || '',
    max_gpu_count: Number(formData.max_gpu_count || 0),
    max_storage_gb: Number(formData.max_storage_gb || 0)
  });

  const handleAddProject = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) return setFormError('Project name is required');
    try {
      await createProject(cleanPayload());
      setFormSuccess('Project created successfully');
      setTimeout(() => { setShowAddModal(false); resetForm(); fetchProjects(); }, 600);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await updateProject(selectedProject.id, cleanPayload());
      setFormSuccess('Project updated successfully');
      setTimeout(() => { setShowEditModal(false); fetchProjects(); }, 600);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    setFormError('');
    try {
      await deleteProject(selectedProject.id);
      setShowDeleteModal(false);
      fetchProjects();
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to delete project');
    }
  };

  const quotaText = (max, used, available, unit) => {
    if (Number(max || 0) === 0) return `${used || 0} ${unit} used / unlimited`;
    return `${used || 0} ${unit} used / ${available ?? Math.max(max - used, 0)} ${unit} free`;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading projects...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Enterprise workspaces for users, GPU quota, and storage quota</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchProjects} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {projects.map((project) => {
          const summary = summaries[project.id] || zeroSummary(project);
          return (
            <div key={project.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}><Briefcase size={18} /> {project.name}</h3>
                  <p style={{ color: '#9ca3af', minHeight: '36px' }}>{project.description || 'No description'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-icon" onClick={() => openEditModal(project)} title="Edit"><Edit size={16} /></button>
                  <button className="btn-icon danger" onClick={() => openDeleteModal(project)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div className="metric-card">
                  <Users size={18} />
                  <div className="metric-value">{summary.users_count ?? 0}</div>
                  <div className="metric-label">Users</div>
                </div>
                <div className="metric-card">
                  <Activity size={18} />
                  <div className="metric-value">{summary.active_instances_count ?? 0}</div>
                  <div className="metric-label">Active Pods</div>
                </div>
                <div className="metric-card">
                  <Cpu size={18} />
                  <div className="metric-value">{summary.gpu_used ?? 0}</div>
                  <div className="metric-label">{quotaText(project.max_gpu_count, summary.gpu_used, summary.gpu_available, 'GPU')}</div>
                </div>
                <div className="metric-card">
                  <HardDrive size={18} />
                  <div className="metric-value">{summary.storage_allocated_gb ?? 0} GB</div>
                  <div className="metric-label">{quotaText(project.max_storage_gb, summary.storage_allocated_gb, summary.storage_available_gb, 'GB')}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Briefcase size={48} />
          <h3>No Projects Found</h3>
          <p>Create a project to group users, GPUs, and storage.</p>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{showAddModal ? 'Create Project' : 'Edit Project'}</h2>
              <button className="btn-icon" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}><X size={20} /></button>
            </div>
            <form onSubmit={showAddModal ? handleAddProject : handleEditProject}>
              <div className="form-group">
                <label>Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="AI research team" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Project purpose" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Max GPU Count</label>
                  <input type="number" min="0" value={formData.max_gpu_count} onChange={(e) => setFormData({ ...formData, max_gpu_count: e.target.value })} />
                  <small>0 = unlimited only for default-project; for real projects use explicit quota.</small>
                </div>
                <div className="form-group">
                  <label>Max Storage GB</label>
                  <input type="number" min="0" value={formData.max_storage_gb} onChange={(e) => setFormData({ ...formData, max_storage_gb: e.target.value })} />
                  <small>0 = unlimited storage quota.</small>
                </div>
              </div>
              {formError && <div className="alert alert-error">{typeof formError === 'string' ? formError : JSON.stringify(formError)}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={18} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>Delete Project</h2><button className="btn-icon" onClick={() => setShowDeleteModal(false)}><X size={20} /></button></div>
            <p>Delete project <strong>{selectedProject.name}</strong>?</p>
            <p style={{ color: '#ef4444' }}>Backend rejects deletion if users or instances still belong to this project.</p>
            {formError && <div className="alert alert-error">{typeof formError === 'string' ? formError : JSON.stringify(formError)}</div>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteProject}><Trash2 size={18} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
