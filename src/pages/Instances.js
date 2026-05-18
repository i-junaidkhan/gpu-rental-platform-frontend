import React, { useState, useEffect } from 'react';
import { Activity, Plus, RefreshCw, Play, Square, Trash2, Clock, CheckCircle, AlertCircle, XCircle, X, Save, Terminal } from 'lucide-react';
// Added getProjects to the import
import { getInstances, createInstance, instanceAction, deleteInstance, getUsers, getRentalPlans, getGpuInventory, getPodLogs, getProjects } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const n = (value) => Number(value || 0);

const Instances = () => {
  const [instances, setInstances] = useState([]);
  const [projects, setProjects] = useState([]); // Added projects state
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [logs, setLogs] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Added project_id to form data
  const [formData, setFormData] = useState({ project_id: '', user_id: '', plan_id: '', gpu_id: '', image: 'nvidia/cuda:12.0-base-ubuntu22.04' });

  const availableImages = [
    { value: 'nvidia/cuda:12.0-base-ubuntu22.04', label: 'CUDA 12.0 Base (Ubuntu 22.04)' },
    { value: 'nvidia/cuda:11.8-base-ubuntu22.04', label: 'CUDA 11.8 Base (Ubuntu 22.04)' },
    { value: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime', label: 'PyTorch 2.0.1 (CUDA 11.7)' },
    { value: 'tensorflow/tensorflow:2.13.0-gpu', label: 'TensorFlow 2.13 GPU' },
    { value: 'jupyter/tensorflow-notebook:latest', label: 'Jupyter TensorFlow Notebook' }
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Added getProjects to the Promise.all array
      const [instancesRes, usersRes, plansRes, gpusRes, projectsRes] = await Promise.all([
        getInstances(), getUsers(), getRentalPlans(), getGpuInventory(), getProjects()
      ]);
      
      const nextUsers = asArray(usersRes.data, 'users');
      const nextPlans = asArray(plansRes.data, 'plans');
      const nextProjects = asArray(projectsRes.data, 'projects');
      
      setInstances(asArray(instancesRes.data, 'instances'));
      setUsers(nextUsers); 
      setPlans(nextPlans); 
      setGpus(asArray(gpusRes.data, 'gpus'));
      setProjects(nextProjects);
      
      setFormData((prev) => ({ 
        ...prev, 
        project_id: prev.project_id || nextProjects[0]?.id || '',
        user_id: prev.user_id || nextUsers[0]?.id || '', 
        plan_id: prev.plan_id || nextPlans[0]?.id || '' 
      }));
    } catch (error) {
      console.error('Error fetching instances data:', error);
      setInstances([]); setUsers([]); setPlans([]); setGpus([]); setProjects([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const resetForm = () => { 
    setFormData({ 
      project_id: projects[0]?.id || '',
      user_id: users[0]?.id || '', 
      plan_id: plans[0]?.id || '', 
      gpu_id: '', 
      image: 'nvidia/cuda:12.0-base-ubuntu22.04' 
    }); 
    setFormError(''); 
    setFormSuccess(''); 
  };
  
  const openCreateModal = () => { resetForm(); setShowCreateModal(true); };
  const closeCreateModal = () => { setShowCreateModal(false); resetForm(); };

  const handleCreateInstance = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    
    // Validate project_id alongside user_id and plan_id
    if (!formData.project_id || !formData.user_id || !formData.plan_id) { 
      setFormError('Please select a project, a user, and a plan'); 
      return; 
    }
    
    try {
      const payload = { 
        project_id: parseInt(formData.project_id),
        user_id: parseInt(formData.user_id), 
        plan_id: parseInt(formData.plan_id), 
        image: formData.image 
      };
      if (formData.gpu_id) payload.gpu_id = parseInt(formData.gpu_id);
      
      const response = await createInstance(payload);
      setFormSuccess(`Instance created${response.data?.pod_name ? `! Pod: ${response.data.pod_name}` : '.'}`);
      await fetchData();
      setTimeout(() => closeCreateModal(), 1200);
    } catch (error) { 
      setFormError(error.response?.data?.detail || 'Failed to create instance'); 
    }
  };

  const handleInstanceAction = async (instance, action) => {
    setActionLoading(`${instance.id}-${action}`);
    try { await instanceAction(instance.id, action); await fetchData(); }
    catch (error) { alert(error.response?.data?.detail || `Failed to ${action} instance`); }
    finally { setActionLoading(null); }
  };

  const handleDeleteInstance = async () => {
    if (!selectedInstance) return;
    setActionLoading(`delete-${selectedInstance.id}`);
    try { await deleteInstance(selectedInstance.id); setShowDeleteModal(false); setSelectedInstance(null); await fetchData(); }
    catch (error) { alert(error.response?.data?.detail || 'Failed to delete instance'); }
    finally { setActionLoading(null); }
  };

  const handleViewLogs = async (instance) => {
    setSelectedInstance(instance); setShowLogsModal(true); setLogs('Loading logs...');
    try { const response = await getPodLogs('gpu-rental-system', instance.pod_name); setLogs(response.data?.logs || 'No logs available'); }
    catch (error) { setLogs(error.response?.data?.detail || 'Failed to fetch logs'); }
  };

  const getProjectName = (projectId) => projects.find((p) => p.id === projectId)?.name || `Project #${projectId}`;
  const getUserName = (userId) => users.find((u) => u.id === userId)?.username || `User #${userId}`;
  const getPlan = (planId) => plans.find((p) => p.id === planId);
  const getPlanName = (planId) => getPlan(planId)?.name || `Plan #${planId}`;
  const getPlanDescription = (plan) => plan ? `${plan.plan_type || 'Plan'} • ${plan.k8s_resource_name || 'resource'} × ${plan.resource_count || 1} • $${plan.price_per_hour ?? 0}/hr` : '—';

  const getStatusIcon = (status) => {
    switch (status) { case 'running': return <CheckCircle size={14} />; case 'stopped': return <Square size={14} />; case 'pending': return <Clock size={14} />; case 'deleted': return <XCircle size={14} />; default: return <AlertCircle size={14} />; }
  };
  const getStatusClass = (status) => {
    switch (status) { case 'running': return 'running'; case 'stopped': return 'pending'; case 'pending': return 'pending'; case 'deleted': return 'failed'; default: return 'failed'; }
  };

  const runningCount = instances.filter((i) => i?.status === 'running').length;
  const stoppedCount = instances.filter((i) => i?.status === 'stopped').length;
  const deletedCount = instances.filter((i) => i?.status === 'deleted').length;
  const availableGpus = gpus.filter((g) => n(g?.available) > 0);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Instances</h1><p>Create and manage GPU rental instances</p></div>
        <div style={{ display: 'flex', gap: '12px' }}><button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spinning' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button><button className="btn btn-primary" onClick={openCreateModal}><Plus size={16} />New Instance</button></div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-icon cyan"><Activity size={24} /></div><div className="stat-content"><h3>{instances.length}</h3><p>Total Instances</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-content"><h3>{runningCount}</h3><p>Running</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Square size={24} /></div><div className="stat-content"><h3>{stoppedCount}</h3><p>Stopped</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><Trash2 size={24} /></div><div className="stat-content"><h3>{deletedCount}</h3><p>Deleted</p></div></div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Instance List ({instances.length})</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Project</th>
                <th>User</th>
                <th>Plan</th>
                <th>Pod</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.length > 0 ? instances.map((instance) => { const plan = getPlan(instance.plan_id); return (
                <tr key={instance.id}>
                  <td>#{instance.id}</td>
                  <td><div style={{ fontWeight: 500, color: '#a855f7' }}>{getProjectName(instance.project_id)}</div></td>
                  <td>{getUserName(instance.user_id)}</td>
                  <td><div style={{ fontWeight: 500 }}>{getPlanName(instance.plan_id)}</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>{getPlanDescription(plan)}</div></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{instance.pod_name || '—'}</td>
                  <td><span className={`status-badge ${getStatusClass(instance.status)}`}>{getStatusIcon(instance.status)}{instance.status || 'unknown'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {instance.status !== 'running' && instance.status !== 'deleted' && <button className="btn btn-secondary" onClick={() => handleInstanceAction(instance, 'start')} disabled={actionLoading === `${instance.id}-start`}><Play size={14} />Start</button>}
                      {instance.status === 'running' && <button className="btn btn-secondary" onClick={() => handleInstanceAction(instance, 'stop')} disabled={actionLoading === `${instance.id}-stop`}><Square size={14} />Stop</button>}
                      {instance.pod_name && <button className="btn btn-secondary" onClick={() => handleViewLogs(instance)}><Terminal size={14} />Logs</button>}
                      <button className="btn btn-danger" onClick={() => { setSelectedInstance(instance); setShowDeleteModal(true); }} disabled={instance.status === 'deleted'}><Trash2 size={14} />Delete</button>
                    </div>
                  </td>
                </tr>
              ); }) : <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No instances found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', width: '100%', maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Create Instance</h2>
              <button onClick={closeCreateModal} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {formError && <div style={{ padding: '12px', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{formError}</div>}
            {formSuccess && <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '14px' }}>{formSuccess}</div>}
            
            <form onSubmit={handleCreateInstance}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Project (Tenant) *</label>
              <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <option value="">Select a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (Quota: {p.max_gpu_count} GPUs)</option>)}
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>User *</label>
              <select value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <option value="">Select a user</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
              </select>
              
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Rental Plan *</label>
              <select value={formData.plan_id} onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <option value="">Select a plan</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - {getPlanDescription(p)}</option>)}
              </select>
              
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>GPU Resource Optional</label>
              <select value={formData.gpu_id} onChange={(e) => setFormData({ ...formData, gpu_id: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                <option value="">No specific GPU resource</option>
                {availableGpus.map((g) => <option key={g.id} value={g.id}>{g.name} on {g.node_name} — available {g.available}</option>)}
              </select>
              
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Image</label>
              <select value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                {availableImages.map((img) => <option key={img.value} value={img.value}>{img.label}</option>)}
              </select>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeCreateModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={16} />Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogsModal && selectedInstance && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', width: '90%', maxWidth: '900px', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2>Logs: {selectedInstance.pod_name}</h2>
              <button onClick={() => setShowLogsModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <pre style={{ backgroundColor: '#111827', color: '#e5e7eb', padding: '16px', borderRadius: '8px', overflow: 'auto', maxHeight: '60vh', whiteSpace: 'pre-wrap' }}>
              {logs}
            </pre>
          </div>
        </div>
      )}

      {showDeleteModal && selectedInstance && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <Trash2 size={34} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Delete Instance?</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Delete instance #{selectedInstance.id} / pod {selectedInstance.pod_name || '—'}?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteInstance}><Trash2 size={16} />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;