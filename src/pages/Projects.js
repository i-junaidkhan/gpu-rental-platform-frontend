import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Save,
  Cpu,
  HardDrive
} from 'lucide-react';
import { getProjects, createProject, updateProject, deleteProject } from '../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_gpu_count: 0,
    max_storage_gb: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      const projectData = Array.isArray(response.data) ? response.data : response.data?.projects || [];
      setProjects(projectData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      max_gpu_count: 0,
      max_storage_gb: 0
    });
    setFormError('');
    setFormSuccess('');
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      max_gpu_count: project.max_gpu_count || 0,
      max_storage_gb: project.max_storage_gb || 0
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name) {
      setFormError('Project Name is required');
      return;
    }

    try {
      await createProject(formData);
      setFormSuccess('Project created successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchProjects();
        resetForm();
      }, 1000);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await updateProject(selectedProject.id, formData);
      setFormSuccess('Project updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        fetchProjects();
        resetForm();
      }, 1000);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(selectedProject.id);
      setShowDeleteModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate cluster-wide totals allocated to projects
  const totalGpusAllocated = projects.reduce((sum, p) => sum + (p.max_gpu_count || 0), 0);
  const totalStorageAllocated = projects.reduce((sum, p) => sum + (p.max_storage_gb || 0), 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Projects (Tenants)</h1>
          <p>Manage tenant workspaces and resource quotas</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <h3>{projects.length}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <h3>{totalGpusAllocated}</h3>
            <p>Total GPUs Allocated</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <h3>{totalStorageAllocated} GB</h3>
            <p>Total Storage Allocated</p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Project List</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Project Name</th>
                <th>Description</th>
                <th>GPU Quota</th>
                <th>Storage Quota</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length > 0 ? (
                projects.map((project, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '500' }}>#{project.id}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{project.name}</td>
                    <td style={{ color: '#9ca3af' }}>{project.description || '—'}</td>
                    <td style={{ fontWeight: '500', color: '#00d4aa' }}>{project.max_gpu_count} GPUs</td>
                    <td style={{ fontWeight: '500', color: '#a855f7' }}>{project.max_storage_gb} GB</td>
                    <td style={{ color: '#9ca3af', fontSize: '13px' }}>{formatDate(project.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEditModal(project)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => openDeleteModal(project)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No projects found. Click "Add Project" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Add New Project</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {formError && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px' }}>{formError}</div>}
            {formSuccess && <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#10b981', marginBottom: '16px' }}>{formSuccess}</div>}

            <form onSubmit={handleAddProject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} placeholder="e.g., AI Research Team Alpha" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Max GPU Quota</label>
                <input type="number" value={formData.max_gpu_count} onChange={(e) => setFormData({ ...formData, max_gpu_count: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Max Storage Quota (GB)</label>
                <input type="number" value={formData.max_storage_gb} onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={16} /> Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal (Simplified for brevity, similar to Add) */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', width: '100%', maxWidth: '480px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Edit Project</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {formError && <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px' }}>{formError}</div>}
            {formSuccess && <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#10b981', marginBottom: '16px' }}>{formSuccess}</div>}

            <form onSubmit={handleEditProject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Max GPU Quota</label>
                <input type="number" value={formData.max_gpu_count} onChange={(e) => setFormData({ ...formData, max_gpu_count: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>Max Storage Quota (GB)</label>
                <input type="number" value={formData.max_storage_gb} onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={28} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Delete Project?</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Are you sure you want to delete <strong>{selectedProject.name}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteProject}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;