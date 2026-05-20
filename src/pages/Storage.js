import React, { useState, useEffect, useCallback } from 'react';
import {
  getStorageVolumes,
  createStorageVolume,
  deleteStorageVolume,
  getUserStorages,
  createUserStorage,
  deleteUserStorage,
  updateUserStorageQuota,
  getUsers,
  getProjects,
  getProjectSummary
} from '../services/api';
import './Storage.css';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);

const Storage = () => {
  const [volumes, setVolumes] = useState([]);
  const [userStorages, setUserStorages] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showUserStorageModal, setShowUserStorageModal] = useState(false);
  const [showEditQuotaModal, setShowEditQuotaModal] = useState(false);

  const [newVolume, setNewVolume] = useState({
    name: '',
    mount_path: '',
    total_capacity_gb: 1000,
    storage_class: 'kf-work1',
    status: 'available'
  });

  const [newUserStorage, setNewUserStorage] = useState({
    project_id: '',
    user_id: '',
    volume_id: '',
    folder_path: '',
    quota_gb: 10
  });

  const [editingStorage, setEditingStorage] = useState(null);
  const [newQuota, setNewQuota] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsRes, volumesRes] = await Promise.all([getProjects(), getStorageVolumes()]);
      const projectList = asArray(projectsRes.data, 'projects');
      const nextProjectId = selectedProject || projectList[0]?.id || '';

      setProjects(projectList);
      setSelectedProject(nextProjectId);
      setVolumes(asArray(volumesRes.data, 'volumes'));

      const [usersRes, storagesRes] = await Promise.all([
        getUsers(nextProjectId || null),
        getUserStorages(nextProjectId ? { project_id: nextProjectId } : {})
      ]);

      setUsers(asArray(usersRes.data, 'users'));
      setUserStorages(asArray(storagesRes.data, 'userStorages'));

      if (nextProjectId) {
        try {
          const summaryRes = await getProjectSummary(nextProjectId);
          setSummary(summaryRes.data);
        } catch (e) {
          console.error('Failed to load project summary', e);
          setSummary(null);
        }
      } else {
        setSummary(null);
      }

      setNewUserStorage(prev => ({
        ...prev,
        project_id: prev.project_id || nextProjectId || '',
        user_id: prev.user_id || asArray(usersRes.data, 'users')[0]?.id || '',
        volume_id: prev.volume_id || asArray(volumesRes.data, 'volumes')[0]?.id || ''
      }));
    } catch (err) {
      console.error('Error fetching storage data:', err);
      setError('Failed to load storage data.');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUserName = (userId) => users.find(u => Number(u.id) === Number(userId))?.username || `User #${userId}`;
  const getProjectName = (projectId) => projects.find(p => Number(p.id) === Number(projectId))?.name || `Project #${projectId}`;
  const getVolumeName = (volumeId) => volumes.find(v => Number(v.id) === Number(volumeId))?.name || `Volume #${volumeId}`;
  const getVolumeMountPath = (volumeId) => volumes.find(v => Number(v.id) === Number(volumeId))?.mount_path || '';

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const calculateVolumeUsage = (volumeId) => {
    const allocations = userStorages.filter(s => Number(s.volume_id) === Number(volumeId));
    return {
      totalAllocated: allocations.reduce((sum, s) => sum + Number(s.quota_gb || 0), 0),
      totalUsed: allocations.reduce((sum, s) => sum + Number(s.used_gb || 0), 0),
      allocationCount: allocations.length
    };
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setNewUserStorage(prev => ({ ...prev, project_id: projectId, user_id: '', volume_id: prev.volume_id }));
  };

  const handleCreateVolume = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createStorageVolume({
        ...newVolume,
        total_capacity_gb: Number(newVolume.total_capacity_gb || 0)
      });
      setShowVolumeModal(false);
      setNewVolume({ name: '', mount_path: '', total_capacity_gb: 1000, storage_class: 'kf-work1', status: 'available' });
      showSuccess('Storage volume created');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create volume');
    }
  };

  const handleCreateUserStorage = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newUserStorage.project_id || !newUserStorage.user_id || !newUserStorage.volume_id || !newUserStorage.folder_path) {
      setError('Project, user, volume, and folder path are required.');
      return;
    }

    try {
      await createUserStorage({
        project_id: Number(newUserStorage.project_id),
        user_id: Number(newUserStorage.user_id),
        volume_id: Number(newUserStorage.volume_id),
        folder_path: newUserStorage.folder_path,
        quota_gb: Number(newUserStorage.quota_gb || 0)
      });
      setShowUserStorageModal(false);
      setNewUserStorage({
        project_id: selectedProject || '',
        user_id: '',
        volume_id: volumes[0]?.id || '',
        folder_path: '',
        quota_gb: 10
      });
      showSuccess('Storage allocation created');
      fetchData();
    } catch (err) {
      setError(typeof err.response?.data?.detail === 'object' ? JSON.stringify(err.response.data.detail) : (err.response?.data?.detail || 'Failed to create allocation'));
    }
  };

  const handleDeleteVolume = async (volumeId) => {
    if (!window.confirm('Delete this storage volume?')) return;
    setError(null);
    try {
      await deleteStorageVolume(volumeId);
      showSuccess('Storage volume deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete volume');
    }
  };

  const handleDeleteUserStorage = async (storageId) => {
    if (!window.confirm('Delete this user storage allocation?')) return;
    setError(null);
    try {
      await deleteUserStorage(storageId);
      showSuccess('Storage allocation deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete allocation');
    }
  };

  const openEditQuota = (storage) => {
    setEditingStorage(storage);
    setNewQuota(storage.quota_gb);
    setShowEditQuotaModal(true);
  };

  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateUserStorageQuota(editingStorage.id, Number(newQuota));
      setShowEditQuotaModal(false);
      setEditingStorage(null);
      showSuccess('Quota updated');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update quota');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading storage...</p></div>;

  return (
    <div className="storage-page">
      <div className="page-header">
        <div><h1>Storage Management</h1><p>Project-aware storage volumes, user folders, and quotas</p></div>
        <div className="header-actions">
          <select value={selectedProject} onChange={e => handleProjectChange(e.target.value)}>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowVolumeModal(true)}>+ Volume</button>
          <button className="btn btn-primary" onClick={() => setShowUserStorageModal(true)}>+ User Folder</button>
        </div>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

      {summary && (
        <div className="storage-stats">
          <div className="stat-card"><h3>{getProjectName(selectedProject)}</h3><p>Selected Project</p></div>
          <div className="stat-card"><h3>{summary.storage_allocated_gb || 0} GB</h3><p>Allocated Storage</p></div>
          <div className="stat-card"><h3>{summary.max_storage_gb === 0 ? 'Unlimited' : `${summary.max_storage_gb} GB`}</h3><p>Project Storage Limit</p></div>
          <div className="stat-card"><h3>{summary.users_count || 0}</h3><p>Project Users</p></div>
        </div>
      )}

      <section className="storage-section">
        <h2>Storage Volumes</h2>
        <div className="storage-grid">
          {volumes.map(volume => {
            const usage = calculateVolumeUsage(volume.id);
            const pct = volume.total_capacity_gb > 0 ? Math.min((usage.totalAllocated / volume.total_capacity_gb) * 100, 100) : 0;
            return (
              <div key={volume.id} className="storage-card">
                <div className="storage-card-header">
                  <h3>{volume.name}</h3>
                  <span className={`status-badge ${volume.status}`}>{volume.status}</span>
                </div>
                <div className="storage-details">
                  <p><strong>Mount:</strong> {volume.mount_path}</p>
                  <p><strong>Class:</strong> {volume.storage_class}</p>
                  <p><strong>Capacity:</strong> {volume.total_capacity_gb} GB</p>
                  <p><strong>Project allocations:</strong> {usage.allocationCount}</p>
                </div>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${pct}%` }}></div>
                </div>
                <p className="usage-text">{usage.totalAllocated} GB allocated in selected project</p>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVolume(volume.id)}>Delete</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="storage-section">
        <h2>User Folder Allocations</h2>
        <div className="table-container">
          <table className="storage-table">
            <thead><tr><th>ID</th><th>Project</th><th>User</th><th>Volume</th><th>Folder Path</th><th>Quota</th><th>Used</th><th>Actions</th></tr></thead>
            <tbody>
              {userStorages.map(storage => (
                <tr key={storage.id}>
                  <td>{storage.id}</td>
                  <td>{getProjectName(storage.project_id)}</td>
                  <td>{getUserName(storage.user_id)}</td>
                  <td>{getVolumeName(storage.volume_id)}</td>
                  <td><code>{storage.folder_path}</code></td>
                  <td>{storage.quota_gb} GB</td>
                  <td>{storage.used_gb || 0} GB</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openEditQuota(storage)}>Edit Quota</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUserStorage(storage.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {userStorages.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No storage allocations for this project</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showVolumeModal && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>Create Storage Volume</h2><button className="btn-icon" onClick={() => setShowVolumeModal(false)}>×</button></div>
          <form onSubmit={handleCreateVolume}>
            <div className="form-group"><label>Name</label><input value={newVolume.name} onChange={e => setNewVolume({ ...newVolume, name: e.target.value })} required /></div>
            <div className="form-group"><label>Mount Path</label><input value={newVolume.mount_path} onChange={e => setNewVolume({ ...newVolume, mount_path: e.target.value })} placeholder="/data3" required /></div>
            <div className="form-group"><label>Total Capacity GB</label><input type="number" value={newVolume.total_capacity_gb} onChange={e => setNewVolume({ ...newVolume, total_capacity_gb: e.target.value })} required /></div>
            <div className="form-group"><label>Storage Class</label><input value={newVolume.storage_class} onChange={e => setNewVolume({ ...newVolume, storage_class: e.target.value })} required /></div>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowVolumeModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
          </form>
        </div></div>
      )}

      {showUserStorageModal && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>Create User Folder Allocation</h2><button className="btn-icon" onClick={() => setShowUserStorageModal(false)}>×</button></div>
          <form onSubmit={handleCreateUserStorage}>
            <div className="form-group"><label>Project</label><select value={newUserStorage.project_id} onChange={e => setNewUserStorage({ ...newUserStorage, project_id: e.target.value, user_id: '' })}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="form-group"><label>User</label><select value={newUserStorage.user_id} onChange={e => setNewUserStorage({ ...newUserStorage, user_id: e.target.value })} required><option value="">Select user</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
            <div className="form-group"><label>Volume</label><select value={newUserStorage.volume_id} onChange={e => {
              const volume = volumes.find(v => Number(v.id) === Number(e.target.value));
              setNewUserStorage({ ...newUserStorage, volume_id: e.target.value, folder_path: volume ? `${volume.mount_path}/users/${getUserName(newUserStorage.user_id) || 'user'}` : '' });
            }} required><option value="">Select volume</option>{volumes.map(v => <option key={v.id} value={v.id}>{v.name} ({v.mount_path})</option>)}</select></div>
            <div className="form-group"><label>Folder Path</label><input value={newUserStorage.folder_path} onChange={e => setNewUserStorage({ ...newUserStorage, folder_path: e.target.value })} placeholder={`${getVolumeMountPath(newUserStorage.volume_id)}/users/testuser`} required /></div>
            <div className="form-group"><label>Quota GB</label><input type="number" min="1" value={newUserStorage.quota_gb} onChange={e => setNewUserStorage({ ...newUserStorage, quota_gb: e.target.value })} required /></div>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowUserStorageModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Allocation</button></div>
          </form>
        </div></div>
      )}

      {showEditQuotaModal && editingStorage && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>Edit Storage Quota</h2><button className="btn-icon" onClick={() => setShowEditQuotaModal(false)}>×</button></div>
          <form onSubmit={handleUpdateQuota}>
            <p><strong>{getUserName(editingStorage.user_id)}</strong> on <strong>{getVolumeName(editingStorage.volume_id)}</strong></p>
            <div className="form-group"><label>New Quota GB</label><input type="number" min="1" value={newQuota} onChange={e => setNewQuota(e.target.value)} required /></div>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEditQuotaModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Update</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
};

export default Storage;
