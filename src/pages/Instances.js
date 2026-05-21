import React, { useState, useEffect } from 'react';
import { Activity, Plus, RefreshCw, Play, Square, Trash2, Clock, CheckCircle, AlertCircle, XCircle, X, Save, Terminal, Box, Cpu, HardDrive } from 'lucide-react';
import {
  getInstances,
  createInstance,
  instanceAction,
  deleteInstance,
  getUsers,
  getRentalPlans,
  getGpuInventory,
  getPodLogs,
  getProjects,
  getUserStorages,
  getInstancePorts,
  openInstancePort,
  closeInstancePort,
  getInstanceLaunch
} from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const n = (value) => Number(value || 0);
const toIdString = (v) => v === null || v === undefined ? '' : String(v);

const IMAGE_OPTIONS = [
  { value: 'ubuntu:22.04', label: 'Ubuntu 22.04 Base' },
  { value: 'nvidia/cuda:12.2.0-runtime-ubuntu22.04', label: 'CUDA 12.2 Runtime' },
  { value: 'nvidia/cuda:12.0-base-ubuntu22.04', label: 'CUDA 12.0 Base' },
  { value: 'pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime', label: 'PyTorch 2.2 CUDA 12.1' },
  { value: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime', label: 'PyTorch 2.0.1 CUDA 11.7' },
  { value: 'jupyter/tensorflow-notebook:latest', label: 'Jupyter TensorFlow Notebook' }
];

const APP_TYPES = [
  { value: 'terminal', label: 'Terminal / Shell' },
  { value: 'jupyter', label: 'Jupyter Lab Placeholder' },
  { value: 'vscode', label: 'VSCode Server Placeholder' },
  { value: 'ssh', label: 'SSH Placeholder' }
];

const Instances = () => {
  const [instances, setInstances] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [storages, setStorages] = useState([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [logs, setLogs] = useState('');
  const [showPortsModal, setShowPortsModal] = useState(false);
  const [ports, setPorts] = useState([]);
  const [portForm, setPortForm] = useState({ port: 8888, target_port: 8888, protocol: 'TCP' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    project_id: '',
    user_id: '',
    plan_id: '',
    gpu_id: '',
    image: 'ubuntu:22.04',
    cpu_cores: 1,
    memory_gb: 4,
    shm_gb: 1,
    storage_id: '',
    app_type: 'terminal',
    node_count: 1
  });

  useEffect(() => { fetchData(); }, [selectedProjectFilter]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [instancesRes, projectsRes, plansRes, gpusRes] = await Promise.all([
        getInstances(),
        getProjects(),
        getRentalPlans(),
        getGpuInventory()
      ]);

      const nextProjects = asArray(projectsRes.data, 'projects');
      const projectId = toIdString(selectedProjectFilter || formData.project_id || nextProjects[0]?.id || '');

      const [usersRes, storagesRes] = await Promise.all([
        getUsers(projectId || null),
        getUserStorages(projectId ? { project_id: projectId } : {})
      ]);

      const nextUsers = asArray(usersRes.data, 'users');
      const nextPlans = asArray(plansRes.data, 'plans');
      const nextStorages = asArray(storagesRes.data, 'userStorages');

      const allInstances = asArray(instancesRes.data, 'instances');
      setInstances(projectId ? allInstances.filter(i => Number(i.project_id) === Number(projectId)) : allInstances);
      setProjects(nextProjects);
      setUsers(nextUsers);
      setPlans(nextPlans);
      setGpus(asArray(gpusRes.data, 'gpus'));
      setStorages(nextStorages);

      setFormData(prev => ({
        ...prev,
        project_id: prev.project_id ? toIdString(prev.project_id) : toIdString(projectId),
        user_id: prev.user_id ? toIdString(prev.user_id) : toIdString(nextUsers[0]?.id),
        plan_id: prev.plan_id ? toIdString(prev.plan_id) : toIdString(nextPlans[0]?.id),
        storage_id: toIdString(prev.storage_id)
      }));
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProjectName = (id) => projects.find(p => Number(p.id) === Number(id))?.name || `Project #${id}`;
  const getUserName = (id) => users.find(u => Number(u.id) === Number(id))?.username || `User #${id}`;
  const getPlanName = (id) => plans.find(p => Number(p.id) === Number(id))?.name || `Plan #${id}`;
  const getStorageLabel = (id) => {
    const s = storages.find(x => Number(x.id) === Number(id));
    return s ? `${s.folder_path} (${s.quota_gb}GB)` : 'No storage mount';
  };

  const usersForProject = users.filter(u => !formData.project_id || Number(u.project_id) === Number(formData.project_id));
  const storagesForSelection = storages.filter(s => (
    (!formData.project_id || Number(s.project_id) === Number(formData.project_id)) &&
    (!formData.user_id || Number(s.user_id) === Number(formData.user_id))
  ));

  const selectedPlan = plans.find(p => Number(p.id) === Number(formData.plan_id));

  const resetCreateForm = () => {
    const projectId = selectedProjectFilter || projects[0]?.id || '';
    const userList = users.filter(u => !projectId || Number(u.project_id) === Number(projectId));
    setFormData({
      project_id: toIdString(projectId),
      user_id: toIdString(userList[0]?.id),
      plan_id: toIdString(plans[0]?.id),
      gpu_id: '',
      image: 'ubuntu:22.04',
      cpu_cores: 1,
      memory_gb: 4,
      shm_gb: 1,
      storage_id: '',
      app_type: 'terminal',
      node_count: 1
    });
    setFormError('');
    setFormSuccess('');
  };

  const openCreateModal = () => { resetCreateForm(); setShowCreateModal(true); };
  const openDeleteModal = (instance) => { setSelectedInstance(instance); setShowDeleteModal(true); };

  const handleProjectChange = (projectId) => {
    const nextUsers = users.filter(u => Number(u.project_id) === Number(projectId));
    setFormData(prev => ({ ...prev, project_id: toIdString(projectId), user_id: nextUsers[0]?.id || '', storage_id: '' }));
  };

  const handleCreateInstance = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.project_id || !formData.user_id || !formData.plan_id || !formData.image) {
      setFormError('Project, user, plan, and image are required');
      return;
    }

    if (Number(formData.node_count || 1) > 1) {
      setFormError('Multi-node pod creation is not implemented yet. Keep node count = 1.');
      return;
    }

    const payload = {
      project_id: Number(formData.project_id),
      user_id: Number(formData.user_id),
      plan_id: Number(formData.plan_id),
      gpu_id: formData.gpu_id ? Number(formData.gpu_id) : null,
      image: formData.image,
      cpu_cores: formData.cpu_cores ? Number(formData.cpu_cores) : null,
      memory_gb: formData.memory_gb ? Number(formData.memory_gb) : null,
      shm_gb: formData.shm_gb ? Number(formData.shm_gb) : null,
      storage_id: formData.storage_id ? Number(formData.storage_id) : null,
      app_type: formData.app_type || 'terminal'
    };

    try {
      await createInstance(payload);
      setFormSuccess('Instance creation requested successfully');
      setTimeout(() => {
        setShowCreateModal(false);
        fetchData();
      }, 800);
    } catch (error) {
      setFormError(typeof error.response?.data?.detail === 'object' ? JSON.stringify(error.response.data.detail) : (error.response?.data?.detail || 'Failed to create instance'));
    }
  };

  const handleAction = async (instance, action) => {
    setActionLoading(`${instance.id}-${action}`);
    try {
      await instanceAction(instance.id, action);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || `Failed to ${action} instance`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInstance = async () => {
    try {
      await deleteInstance(selectedInstance.id);
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete instance');
    }
  };

  const handleViewLogs = async (instance) => {
    setSelectedInstance(instance);
    setLogs('Loading logs...');
    setShowLogsModal(true);
    try {
      const response = await getPodLogs(instance.namespace || 'gpu-rental-system', instance.pod_name);
      setLogs(response.data?.logs || response.data || 'No logs available');
    } catch (error) {
      setLogs(error.response?.data?.detail || 'Failed to load logs');
    }
  };


  const openPortsModal = async (instance) => {
    setSelectedInstance(instance);
    setPorts([]);
    setPortForm({ port: instance.app_type === 'ssh' ? 22 : 8888, target_port: instance.app_type === 'ssh' ? 22 : 8888, protocol: 'TCP' });
    setShowPortsModal(true);
    try {
      const response = await getInstancePorts(instance.id);
      setPorts(asArray(response.data, 'ports'));
    } catch (error) {
      setPorts([]);
    }
  };

  const refreshPorts = async () => {
    if (!selectedInstance) return;
    try {
      const response = await getInstancePorts(selectedInstance.id);
      setPorts(asArray(response.data, 'ports'));
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to refresh ports');
    }
  };

  const handleOpenPort = async (e) => {
    e.preventDefault();
    if (!selectedInstance) return;
    try {
      await openInstancePort(selectedInstance.id, {
        port: Number(portForm.port),
        target_port: Number(portForm.target_port || portForm.port),
        protocol: portForm.protocol || 'TCP'
      });
      await refreshPorts();
    } catch (error) {
      alert(typeof error.response?.data?.detail === 'object' ? JSON.stringify(error.response.data.detail) : (error.response?.data?.detail || 'Failed to open port'));
    }
  };

  const handleClosePort = async (port) => {
    if (!selectedInstance) return;
    if (!window.confirm(`Close port ${port.port}?`)) return;
    try {
      await closeInstancePort(selectedInstance.id, port.id);
      await refreshPorts();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to close port');
    }
  };

  const handleLaunch = async (instance) => {
    try {
      const response = await getInstanceLaunch(instance.id);
      const first = (response.data?.ports || []).find(p => p.launch_url);
      if (first?.launch_url) {
        window.open(first.launch_url, '_blank');
      } else {
        alert('No open launch port yet. Open a port first.');
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to get launch URL');
    }
  };


  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'running': return <CheckCircle size={16} color="#22c55e" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'stopped': return <Square size={16} color="#6b7280" />;
      case 'error': return <XCircle size={16} color="#ef4444" />;
      case 'deleted': return <Trash2 size={16} color="#6b7280" />;
      default: return <AlertCircle size={16} color="#9ca3af" />;
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading instances...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Instances</h1><p>Create project-aware pods with GPU, CPU, RAM, storage, image, and app type</p></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={toIdString(selectedProjectFilter)} onChange={e => setSelectedProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh</button>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={18} /> New Instance</button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Pod</th><th>Project</th><th>User</th><th>Plan</th><th>Status</th><th>Cost</th><th>Actions</th></tr></thead>
          <tbody>
            {instances.map(instance => (
              <tr key={instance.id}>
                <td>{instance.id}</td>
                <td><Box size={16} /> {instance.pod_name}</td>
                <td>{getProjectName(instance.project_id)}</td>
                <td>{getUserName(instance.user_id)}</td>
                <td>{getPlanName(instance.plan_id)}</td>
                <td><span className={`status-badge ${instance.status}`}>{getStatusIcon(instance.status)} {instance.status}</span></td>
                <td>{Number(instance.accumulated_cost || 0).toFixed(2)}</td>
                <td>
                  <button className="btn-icon" title="Logs" onClick={() => handleViewLogs(instance)}><Terminal size={16} /></button>
                  <button className="btn-icon" title="Ports" onClick={() => openPortsModal(instance)}>Port</button>
                  <button className="btn-icon" title="Launch" onClick={() => handleLaunch(instance)}>Open</button>
                  <button className="btn-icon" title="Start" disabled={actionLoading === `${instance.id}-start`} onClick={() => handleAction(instance, 'start')}><Play size={16} /></button>
                  <button className="btn-icon" title="Stop" disabled={actionLoading === `${instance.id}-stop`} onClick={() => handleAction(instance, 'stop')}><Square size={16} /></button>
                  <button className="btn-icon danger" title="Delete" onClick={() => openDeleteModal(instance)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {instances.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>No instances found</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay"><div className="modal large">
          <div className="modal-header"><h2>Create Instance</h2><button className="btn-icon" onClick={() => setShowCreateModal(false)}><X size={20} /></button></div>
          <form onSubmit={handleCreateInstance}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Project *</label>
                <select value={toIdString(formData.project_id)} onChange={e => handleProjectChange(e.target.value)} required>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name} (GPU limit: {p.max_gpu_count === 0 ? 'unlimited/default or zero' : p.max_gpu_count})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>User *</label>
                <select value={toIdString(formData.user_id)} onChange={e => setFormData({ ...formData, user_id: e.target.value, storage_id: '' })} required>
                  <option value="">Select user</option>
                  {usersForProject.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>GPU Plan *</label>
                <select value={toIdString(formData.plan_id)} onChange={e => setFormData({ ...formData, plan_id: e.target.value })} required>
                  <option value="">Select plan</option>
                  {plans.map(plan => <option key={plan.id} value={String(plan.id)}>{plan.name} - {plan.resource_count} x {plan.k8s_resource_name}</option>)}
                </select>
                {selectedPlan && <small>{selectedPlan.price_per_hour}/hour</small>}
              </div>
              <div className="form-group">
                <label>Image *</label>
                <select value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} required>
                  {IMAGE_OPTIONS.map(img => <option key={img.value} value={img.value}>{img.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div className="form-group"><label>CPU Cores</label><input type="number" min="0.1" step="0.1" value={formData.cpu_cores} onChange={e => setFormData({ ...formData, cpu_cores: e.target.value })} /></div>
              <div className="form-group"><label>Memory GB</label><input type="number" min="1" step="1" value={formData.memory_gb} onChange={e => setFormData({ ...formData, memory_gb: e.target.value })} /></div>
              <div className="form-group"><label>Shared Memory GB</label><input type="number" min="0" step="1" value={formData.shm_gb} onChange={e => setFormData({ ...formData, shm_gb: e.target.value })} /></div>
              <div className="form-group"><label>Node Count</label><input type="number" min="1" max="1" value={formData.node_count} onChange={e => setFormData({ ...formData, node_count: e.target.value })} /><small>Multi-node placeholder</small></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Storage Mount</label>
                <select value={toIdString(formData.storage_id)} onChange={e => setFormData({ ...formData, storage_id: e.target.value })}>
                  <option value="">No storage mount</option>
                  {storagesForSelection.map(s => <option key={s.id} value={String(s.id)}>{getStorageLabel(s.id)}</option>)}
                </select>
                <small>Mounted to /workspace if selected.</small>
              </div>
              <div className="form-group">
                <label>Application Type</label>
                <select value={formData.app_type} onChange={e => setFormData({ ...formData, app_type: e.target.value })}>
                  {APP_TYPES.map(app => <option key={app.value} value={app.value}>{app.label}</option>)}
                </select>
                <small>Stored in pod labels. Full launcher comes in Port/App batch.</small>
              </div>
            </div>

            {gpus.length > 0 && (
              <div className="form-group">
                <label>GPU Inventory Snapshot</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {gpus.map(gpu => <div key={gpu.id || gpu.resource_name} className="metric-card"><Cpu size={16} /><strong>{gpu.name || gpu.resource_name}</strong><small>available: {n(gpu.available)} / capacity: {n(gpu.capacity)}</small></div>)}
                </div>
              </div>
            )}

            {formError && <div className="alert alert-error">{typeof formError === 'string' ? formError : JSON.stringify(formError)}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Create Pod</button>
            </div>
          </form>
        </div></div>
      )}

      {showDeleteModal && selectedInstance && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>Delete Instance</h2><button className="btn-icon" onClick={() => setShowDeleteModal(false)}><X size={20} /></button></div>
          <p>Delete instance <strong>{selectedInstance.pod_name}</strong>?</p>
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button><button className="btn btn-danger" onClick={handleDeleteInstance}>Delete</button></div>
        </div></div>
      )}


      {showPortsModal && selectedInstance && (
        <div className="modal-overlay"><div className="modal large">
          <div className="modal-header"><h2>Ports / App Access: {selectedInstance.pod_name}</h2><button className="btn-icon" onClick={() => setShowPortsModal(false)}><X size={20} /></button></div>

          <form onSubmit={handleOpenPort} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group"><label>External Port</label><input type="number" min="1" max="65535" value={portForm.port} onChange={e => setPortForm({ ...portForm, port: e.target.value })} required /></div>
            <div className="form-group"><label>Target Port</label><input type="number" min="1" max="65535" value={portForm.target_port} onChange={e => setPortForm({ ...portForm, target_port: e.target.value })} required /></div>
            <div className="form-group"><label>Protocol</label><select value={portForm.protocol} onChange={e => setPortForm({ ...portForm, protocol: e.target.value })}><option value="TCP">TCP</option></select></div>
            <button type="submit" className="btn btn-primary">Open Port</button>
          </form>

          <div className="table-container" style={{ marginTop: '16px' }}>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Port</th><th>Target</th><th>NodePort</th><th>URL</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {ports.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.port}</td>
                    <td>{p.target_port}</td>
                    <td>{p.node_port || '-'}</td>
                    <td>{p.launch_url ? <a href={p.launch_url} target="_blank" rel="noreferrer">{p.launch_url}</a> : '-'}</td>
                    <td>{p.status}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleClosePort(p)}>Close</button></td>
                  </tr>
                ))}
                {ports.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No open ports</td></tr>}
              </tbody>
            </table>
          </div>
        </div></div>
      )}

      {showLogsModal && (
        <div className="modal-overlay"><div className="modal large">
          <div className="modal-header"><h2>Logs: {selectedInstance?.pod_name}</h2><button className="btn-icon" onClick={() => setShowLogsModal(false)}><X size={20} /></button></div>
          <pre style={{ background: '#111827', color: '#e5e7eb', padding: '16px', borderRadius: '8px', maxHeight: '500px', overflow: 'auto' }}>{logs}</pre>
        </div></div>
      )}
    </div>
  );
};

export default Instances;
