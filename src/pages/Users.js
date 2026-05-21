import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, RefreshCw, Shield, User, Edit, Trash2, X, Save } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getProjects } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const toIdString = (v) => v === null || v === undefined ? '' : String(v);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    balance: 0,
    project_id: '',
    mfa_enabled: false
  });

  useEffect(() => { fetchData(); }, [selectedProjectFilter]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        getUsers(selectedProjectFilter || null),
        getProjects()
      ]);
      const projectList = asArray(projectsRes.data, 'projects');
      setProjects(projectList);
      setUsers(asArray(usersRes.data, 'users'));
      setFormData(prev => ({ ...prev, project_id: prev.project_id ? toIdString(prev.project_id) : toIdString(projectList[0]?.id) }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProjectName = (id) => projects.find(p => Number(p.id) === Number(id))?.name || (id ? `Project #${id}` : 'Unassigned');

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: 'user',
      balance: 0,
      project_id: toIdString(projects[0]?.id),
      mfa_enabled: false
    });
    setFormError('');
    setFormSuccess('');
  };

  const openAddModal = () => { resetForm(); setShowAddModal(true); };
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      balance: Number(user.balance || 0),
      project_id: user.project_id ? toIdString(user.project_id) : toIdString(projects[0]?.id),
      mfa_enabled: Boolean(user.mfa_enabled)
    });
    setFormError('');
    setShowEditModal(true);
  };
  const openDeleteModal = (user) => { setSelectedUser(user); setShowDeleteModal(true); };

  const payload = () => ({
    username: formData.username.trim(),
    email: formData.email.trim(),
    role: formData.role,
    balance: Number(formData.balance || 0),
    project_id: formData.project_id ? Number(formData.project_id) : null,
    mfa_enabled: Boolean(formData.mfa_enabled)
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.username.trim() || !formData.email.trim()) return setFormError('Username and email are required');
    try {
      await createUser(payload());
      setFormSuccess('User created successfully');
      setTimeout(() => { setShowAddModal(false); resetForm(); fetchData(); }, 600);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await updateUser(selectedUser.id, payload());
      setFormSuccess('User updated successfully');
      setTimeout(() => { setShowEditModal(false); fetchData(); }, 600);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    setFormError('');
    try {
      await deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const renderForm = (onSubmit) => (
    <form onSubmit={onSubmit}>
      <div className="form-group"><label>Username *</label><input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required /></div>
      <div className="form-group"><label>Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label>Project</label>
          <select value={toIdString(formData.project_id)} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
            <option value="">Unassigned</option>
            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
            <option value="superadmin">superadmin</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
            <option value="customer">customer</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group"><label>Balance</label><input type="number" step="0.01" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} /></div>
        <div className="form-group">
          <label>MFA</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
            <input type="checkbox" checked={formData.mfa_enabled} onChange={e => setFormData({ ...formData, mfa_enabled: e.target.checked })} />
            Enabled
          </label>
        </div>
      </div>
      {formError && <div className="alert alert-error">{typeof formError === 'string' ? formError : JSON.stringify(formError)}</div>}
      {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Save size={18} /> Save</button>
      </div>
    </form>
  );

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading users...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><p>Project-aware users, roles, MFA, and balances</p></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={toIdString(selectedProjectFilter)} onChange={e => setSelectedProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh</button>
          <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add User</button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>ID</th><th>User</th><th>Email</th><th>Project</th><th>Role</th><th>MFA</th><th>Balance</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><User size={16} /> {user.username}</td>
                <td>{user.email}</td>
                <td>{getProjectName(user.project_id)}</td>
                <td><span className={`badge ${user.role === 'superadmin' ? 'danger' : user.role === 'admin' ? 'warning' : 'success'}`}><Shield size={14} /> {user.role}</span></td>
                <td>{user.mfa_enabled ? 'ON' : 'OFF'}</td>
                <td>{Number(user.balance || 0).toFixed(2)}</td>
                <td>
                  <button className="btn-icon" onClick={() => openEditModal(user)}><Edit size={16} /></button>
                  <button className="btn-icon danger" onClick={() => openDeleteModal(user)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ textAlign: 'center', padding: '40px' }}><UsersIcon size={44} /><p>No users found</p></div>}
      </div>

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>{showAddModal ? 'Add User' : 'Edit User'}</h2><button className="btn-icon" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}><X size={20} /></button></div>
          {renderForm(showAddModal ? handleAddUser : handleEditUser)}
        </div></div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal-overlay"><div className="modal">
          <div className="modal-header"><h2>Delete User</h2><button className="btn-icon" onClick={() => setShowDeleteModal(false)}><X size={20} /></button></div>
          <p>Delete <strong>{selectedUser.username}</strong>?</p>
          {formError && <div className="alert alert-error">{typeof formError === 'string' ? formError : JSON.stringify(formError)}</div>}
          <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button><button className="btn btn-danger" onClick={handleDeleteUser}><Trash2 size={18} /> Delete</button></div>
        </div></div>
      )}
    </div>
  );
};

export default Users;
