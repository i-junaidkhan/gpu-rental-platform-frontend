import React, { useState, useEffect, useCallback } from 'react';
import {
  getStorageVolumes,
  createStorageVolume,
  deleteStorageVolume,
  getUserStorages,
  createUserStorage,
  deleteUserStorage,
  updateUserStorageQuota,
  getUsers
} from '../services/api';
import './Storage.css';

const Storage = () => {
  // ============== STATE ==============
  const [volumes, setVolumes] = useState([]);
  const [userStorages, setUserStorages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal States
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showUserStorageModal, setShowUserStorageModal] = useState(false);
  const [showEditQuotaModal, setShowEditQuotaModal] = useState(false);

  // Form States
  const [newVolume, setNewVolume] = useState({
    name: '',
    mount_path: '',
    total_capacity_gb: 1000,
    storage_class: 'kf-work1'
  });

  const [newUserStorage, setNewUserStorage] = useState({
    user_id: '',
    volume_id: '',
    folder_path: '',
    quota_gb: 100
  });

  const [editingStorage, setEditingStorage] = useState(null);
  const [newQuota, setNewQuota] = useState(100);

  // ============== DATA FETCHING ==============
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [volumesRes, userStoragesRes, usersRes] = await Promise.all([
        getStorageVolumes(),
        getUserStorages(),
        getUsers()
      ]);
      setVolumes(volumesRes.data || []);
      setUserStorages(userStoragesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Error fetching storage data:', err);
      setError('Failed to load storage data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============== HELPER FUNCTIONS ==============
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  const getVolumeName = (volumeId) => {
    const volume = volumes.find(v => v.id === volumeId);
    return volume ? volume.name : `Volume #${volumeId}`;
  };

  const getVolumeMountPath = (volumeId) => {
    const volume = volumes.find(v => v.id === volumeId);
    return volume ? volume.mount_path : '';
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const calculateVolumeUsage = (volumeId) => {
    const allocations = userStorages.filter(s => s.volume_id === volumeId);
    const totalAllocated = allocations.reduce((sum, s) => sum + s.quota_gb, 0);
    const totalUsed = allocations.reduce((sum, s) => sum + (s.used_gb || 0), 0);
    return { totalAllocated, totalUsed, allocationCount: allocations.length };
  };

  // ============== VOLUME HANDLERS ==============
  const handleAddVolume = async (e) => {
    e.preventDefault();
    try {
      await createStorageVolume(newVolume);
      setShowVolumeModal(false);
      setNewVolume({ name: '', mount_path: '', total_capacity_gb: 1000, storage_class: 'kf-work1' });
      showSuccess('Storage volume added successfully!');
      fetchData();
    } catch (err) {
      console.error('Error creating volume:', err);
      setError(err.response?.data?.detail || 'Failed to create storage volume');
    }
  };

  const handleDeleteVolume = async (volumeId) => {
    const usage = calculateVolumeUsage(volumeId);
    if (usage.allocationCount > 0) {
      setError(`Cannot delete volume: ${usage.allocationCount} user allocation(s) exist. Remove allocations first.`);
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this storage volume?')) return;
    
    try {
      await deleteStorageVolume(volumeId);
      showSuccess('Storage volume deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting volume:', err);
      setError(err.response?.data?.detail || 'Failed to delete storage volume');
    }
  };

  // ============== USER STORAGE HANDLERS ==============
  const handleAllocateStorage = async (e) => {
    e.preventDefault();
    try {
      const volume = volumes.find(v => v.id === parseInt(newUserStorage.volume_id));
      if (volume) {
        const usage = calculateVolumeUsage(volume.id);
        const availableSpace = volume.total_capacity_gb - usage.totalAllocated;
        if (newUserStorage.quota_gb > availableSpace) {
          setError(`Insufficient space. Available: ${availableSpace} GB`);
          return;
        }
      }

      await createUserStorage({
        ...newUserStorage,
        user_id: parseInt(newUserStorage.user_id),
        volume_id: parseInt(newUserStorage.volume_id),
        quota_gb: parseInt(newUserStorage.quota_gb)
      });
      setShowUserStorageModal(false);
      setNewUserStorage({ user_id: '', volume_id: '', folder_path: '', quota_gb: 100 });
      showSuccess('User storage allocated successfully!');
      fetchData();
    } catch (err) {
      console.error('Error allocating storage:', err);
      setError(err.response?.data?.detail || 'Failed to allocate user storage');
    }
  };

  const handleDeleteUserStorage = async (storageId) => {
    if (!window.confirm('Are you sure you want to remove this user storage allocation?')) return;
    
    try {
      await deleteUserStorage(storageId);
      showSuccess('User storage allocation removed successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting user storage:', err);
      setError(err.response?.data?.detail || 'Failed to delete user storage');
    }
  };

  const handleEditQuota = (storage) => {
    setEditingStorage(storage);
    setNewQuota(storage.quota_gb);
    setShowEditQuotaModal(true);
  };

  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    try {
      await updateUserStorageQuota(editingStorage.id, newQuota);
      setShowEditQuotaModal(false);
      setEditingStorage(null);
      showSuccess('Storage quota updated successfully!');
      fetchData();
    } catch (err) {
      console.error('Error updating quota:', err);
      setError(err.response?.data?.detail || 'Failed to update quota');
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === parseInt(userId));
    const volumeId = newUserStorage.volume_id;
    const mountPath = volumeId ? getVolumeMountPath(parseInt(volumeId)) : '/data3';
    
    setNewUserStorage({
      ...newUserStorage,
      user_id: userId,
      folder_path: user ? `${mountPath}/users/${user.username}` : ''
    });
  };

  const handleVolumeSelect = (volumeId) => {
    const user = users.find(u => u.id === parseInt(newUserStorage.user_id));
    const mountPath = getVolumeMountPath(parseInt(volumeId));
    
    setNewUserStorage({
      ...newUserStorage,
      volume_id: volumeId,
      folder_path: user ? `${mountPath}/users/${user.username}` : ''
    });
  };

  // ============== RENDER ==============
  if (loading) {
    return (
      <div className="storage-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading storage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-container">
      <div className="storage-header">
        <h1>💾 Storage Management</h1>
        <p className="subtitle">Manage storage volumes and user allocations</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Storage Overview Cards */}
      <div className="storage-overview">
        <div className="overview-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>{volumes.length}</h3>
            <p>Storage Volumes</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>{userStorages.length}</h3>
            <p>User Allocations</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">💿</div>
          <div className="card-content">
            <h3>{volumes.reduce((sum, v) => sum + v.total_capacity_gb, 0).toLocaleString()} GB</h3>
            <p>Total Capacity</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{userStorages.reduce((sum, s) => sum + s.quota_gb, 0).toLocaleString()} GB</h3>
            <p>Total Allocated</p>
          </div>
        </div>
      </div>

      {/* Storage Volumes Section */}
      <div className="storage-section">
        <div className="section-header">
          <h2>📦 Storage Volumes</h2>
          <button className="btn btn-primary" onClick={() => setShowVolumeModal(true)}>
            + Add Volume
          </button>
        </div>

        {volumes.length === 0 ? (
          <div className="empty-state">
            <p>No storage volumes configured. Click "Add Volume" to create one.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="storage-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mount Path</th>
                  <th>Storage Class</th>
                  <th>Capacity</th>
                  <th>Allocated</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volumes.map(volume => {
                  const usage = calculateVolumeUsage(volume.id);
                  const usagePercent = ((usage.totalAllocated / volume.total_capacity_gb) * 100).toFixed(1);
                  return (
                    <tr key={volume.id}>
                      <td><strong>{volume.name}</strong></td>
                      <td><code>{volume.mount_path}</code></td>
                      <td><span className="badge badge-info">{volume.storage_class}</span></td>
                      <td>{volume.total_capacity_gb.toLocaleString()} GB</td>
                      <td>{usage.totalAllocated.toLocaleString()} GB ({usage.allocationCount} users)</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${usagePercent > 80 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{usagePercent}%</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${volume.status}`}>
                          {volume.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteVolume(volume.id)}
                          title="Delete Volume"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Storage Allocations Section */}
      <div className="storage-section">
        <div className="section-header">
          <h2>👥 User Storage Allocations</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowUserStorageModal(true)}
            disabled={volumes.length === 0}
            title={volumes.length === 0 ? 'Add a volume first' : 'Allocate storage to user'}
          >
            + Allocate Storage
          </button>
        </div>

        {userStorages.length === 0 ? (
          <div className="empty-state">
            <p>No user storage allocations. Click "Allocate Storage" to assign storage to users.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="storage-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Volume</th>
                  <th>Folder Path</th>
                  <th>Quota</th>
                  <th>Used</th>
                  <th>Usage</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userStorages.map(storage => {
                  const usagePercent = ((storage.used_gb / storage.quota_gb) * 100).toFixed(1);
                  return (
                    <tr key={storage.id}>
                      <td><strong>{getUserName(storage.user_id)}</strong></td>
                      <td>{getVolumeName(storage.volume_id)}</td>
                      <td><code>{storage.folder_path}</code></td>
                      <td>{storage.quota_gb} GB</td>
                      <td>{storage.used_gb?.toFixed(1) || 0} GB</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${usagePercent > 80 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{usagePercent}%</span>
                      </td>
                      <td>{new Date(storage.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditQuota(storage)}
                          title="Edit Quota"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUserStorage(storage.id)}
                          title="Remove Allocation"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="storage-section info-section">
        <h2>ℹ️ How Storage Management Works</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4>1. Storage Volumes</h4>
            <p>Admin creates storage volumes that map to physical NFS mounts (e.g., /data3). Each volume has a total capacity and storage class.</p>
          </div>
          <div className="info-card">
            <h4>2. User Allocations</h4>
            <p>Admin allocates storage quota to users on specific volumes. Each user gets a dedicated folder path within the volume.</p>
          </div>
          <div className="info-card">
            <h4>3. Pod Integration</h4>
            <p>When creating a Pod, users can mount their allocated storage folder. The system enforces quota limits.</p>
          </div>
          <div className="info-card">
            <h4>4. Usage Tracking</h4>
            <p>The system tracks actual storage usage per user and alerts when approaching quota limits.</p>
          </div>
        </div>
      </div>

      {/* Add Volume Modal */}
      {showVolumeModal && (
        <div className="modal-overlay" onClick={() => setShowVolumeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Storage Volume</h3>
              <button className="modal-close" onClick={() => setShowVolumeModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddVolume}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Volume Name *</label>
                  <input
                    type="text"
                    value={newVolume.name}
                    onChange={e => setNewVolume({...newVolume, name: e.target.value})}
                    placeholder="e.g., data3-main, project-storage"
                    required
                  />
                  <small>A descriptive name for this storage volume</small>
                </div>
                <div className="form-group">
                  <label>Mount Path *</label>
                  <input
                    type="text"
                    value={newVolume.mount_path}
                    onChange={e => setNewVolume({...newVolume, mount_path: e.target.value})}
                    placeholder="e.g., /data3, /mnt/storage"
                    required
                  />
                  <small>The NFS mount path on the cluster nodes</small>
                </div>
                <div className="form-group">
                  <label>Total Capacity (GB) *</label>
                  <input
                    type="number"
                    value={newVolume.total_capacity_gb}
                    onChange={e => setNewVolume({...newVolume, total_capacity_gb: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                  <small>Total storage capacity in gigabytes</small>
                </div>
                <div className="form-group">
                  <label>Storage Class</label>
                  <select
                    value={newVolume.storage_class}
                    onChange={e => setNewVolume({...newVolume, storage_class: e.target.value})}
                  >
                    <option value="kf-work1">kf-work1 (Default NFS)</option>
                    <option value="local-storage">local-storage</option>
                    <option value="fast-ssd">fast-ssd</option>
                  </select>
                  <small>Kubernetes storage class for this volume</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVolumeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate User Storage Modal */}
      {showUserStorageModal && (
        <div className="modal-overlay" onClick={() => setShowUserStorageModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Allocate User Storage</h3>
              <button className="modal-close" onClick={() => setShowUserStorageModal(false)}>×</button>
            </div>
            <form onSubmit={handleAllocateStorage}>
              <div className="modal-body">
                <div className="form-group">
                  <label>User *</label>
                  <select
                    value={newUserStorage.user_id}
                    onChange={e => handleUserSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Select User --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Storage Volume *</label>
                  <select
                    value={newUserStorage.volume_id}
                    onChange={e => handleVolumeSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Select Volume --</option>
                    {volumes.map(volume => {
                      const usage = calculateVolumeUsage(volume.id);
                      const available = volume.total_capacity_gb - usage.totalAllocated;
                      return (
                        <option key={volume.id} value={volume.id}>
                          {volume.name} ({available.toLocaleString()} GB available)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Folder Path *</label>
                  <input
                    type="text"
                    value={newUserStorage.folder_path}
                    onChange={e => setNewUserStorage({...newUserStorage, folder_path: e.target.value})}
                    placeholder="e.g., /data3/users/username"
                    required
                  />
                  <small>User's dedicated folder path (auto-generated based on selection)</small>
                </div>
                <div className="form-group">
                  <label>Storage Quota (GB) *</label>
                  <input
                    type="number"
                    value={newUserStorage.quota_gb}
                    onChange={e => setNewUserStorage({...newUserStorage, quota_gb: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                  <small>Maximum storage the user can use</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserStorageModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Allocate Storage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      {showEditQuotaModal && editingStorage && (
        <div className="modal-overlay" onClick={() => setShowEditQuotaModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Storage Quota</h3>
              <button className="modal-close" onClick={() => setShowEditQuotaModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateQuota}>
              <div className="modal-body">
                <p>User: <strong>{getUserName(editingStorage.user_id)}</strong></p>
                <p>Volume: <strong>{getVolumeName(editingStorage.volume_id)}</strong></p>
                <p>Current Usage: <strong>{editingStorage.used_gb?.toFixed(1) || 0} GB</strong></p>
                <div className="form-group">
                  <label>New Quota (GB)</label>
                  <input
                    type="number"
                    value={newQuota}
                    onChange={e => setNewQuota(parseInt(e.target.value))}
                    min={Math.ceil(editingStorage.used_gb || 1)}
                    required
                  />
                  <small>Must be at least {Math.ceil(editingStorage.used_gb || 1)} GB (current usage)</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditQuotaModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Storage;
