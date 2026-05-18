import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Cpu,
  HardDrive,
  DollarSign,
  Edit,
  Trash2,
  Zap,
  X,
  Save
} from 'lucide-react';
import { getRentalPlans, createPlan, updatePlan, deletePlan } from '../services/api';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    vcpu: 2,
    ram_gb: 4,
    price_per_hour: 0.50
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await getRentalPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      vcpu: 2,
      ram_gb: 4,
      price_per_hour: 0.50
    });
    setFormError('');
    setFormSuccess('');
  };

  // Open Add Modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      vcpu: plan.vcpu,
      ram_gb: plan.ram_gb,
      price_per_hour: plan.price_per_hour
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  // Handle Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Please enter a plan name');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        vcpu: parseInt(formData.vcpu),
        ram_gb: parseInt(formData.ram_gb),
        price_per_hour: parseFloat(formData.price_per_hour)
      };

      await createPlan(payload);
      setFormSuccess('Plan created successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchPlans();
        resetForm();
      }, 1000);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create plan');
    }
  };

  // Handle Edit Plan
  const handleEditPlan = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        name: formData.name,
        vcpu: parseInt(formData.vcpu),
        ram_gb: parseInt(formData.ram_gb),
        price_per_hour: parseFloat(formData.price_per_hour)
      };

      await updatePlan(selectedPlan.id, payload);
      setFormSuccess('Plan updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        fetchPlans();
        resetForm();
      }, 1000);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to update plan');
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async () => {
    try {
      await deletePlan(selectedPlan.id);
      setShowDeleteModal(false);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  // Get plan tier color
  const getPlanColor = (index) => {
    const colors = [
      { bg: 'rgba(0, 212, 170, 0.15)', color: '#00d4aa', gradient: 'linear-gradient(135deg, #00d4aa, #00b894)' },
      { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
      { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    ];
    return colors[index % colors.length];
  };

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
          <h1>Rental Plans</h1>
          <p>Manage GPU rental pricing and resource allocations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon cyan">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{plans.length}</h3>
            <p>Total Plans</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>${plans.length > 0 ? Math.min(...plans.map(p => p.price_per_hour || 0)).toFixed(2) : '0.00'}</h3>
            <p>Lowest Price/hr</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>${plans.length > 0 ? Math.max(...plans.map(p => p.price_per_hour || 0)).toFixed(2) : '0.00'}</h3>
            <p>Highest Price/hr</p>
          </div>
        </div>
      </div>

      {/* Plans Cards or Empty State */}
      {plans.length > 0 ? (
        <>
          {/* Plan Cards */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            {plans.map((plan, index) => {
              const planColor = getPlanColor(index);
              return (
                <div className="card" key={index} style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: planColor.gradient
                  }}></div>

                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{plan.name}</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>Plan ID: #{plan.id}</p>
                      </div>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: planColor.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Zap size={24} style={{ color: planColor.color }} />
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: '24px' }}>
                      <span style={{ fontSize: '36px', fontWeight: '700', color: planColor.color }}>
                        ${plan.price_per_hour?.toFixed(2) || '0.00'}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}> / hour</span>
                    </div>

                    {/* Resources */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 212, 170, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Cpu size={16} style={{ color: '#00d4aa' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500' }}>{plan.vcpu || '—'} vCPUs</p>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Virtual CPU cores</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(168, 85, 247, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <HardDrive size={16} style={{ color: '#a855f7' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500' }}>{plan.ram_gb || '—'} GB RAM</p>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Memory allocation</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => openEditModal(plan)}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '10px' }}
                        onClick={() => openDeleteModal(plan)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plans Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Plan Details</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Plan Name</th>
                    <th>vCPU</th>
                    <th>RAM</th>
                    <th>Price/Hour</th>
                    <th>Daily Cost</th>
                    <th>Monthly Est.</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>#{plan.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Zap size={16} style={{ color: getPlanColor(index).color }} />
                          {plan.name}
                        </div>
                      </td>
                      <td>{plan.vcpu || '—'} cores</td>
                      <td>{plan.ram_gb || '—'} GB</td>
                      <td style={{ fontWeight: '600', color: '#00d4aa' }}>
                        ${plan.price_per_hour?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ color: '#9ca3af' }}>
                        ${((plan.price_per_hour || 0) * 24).toFixed(2)}
                      </td>
                      <td style={{ color: '#9ca3af' }}>
                        ${((plan.price_per_hour || 0) * 24 * 30).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => openEditModal(plan)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => openDeleteModal(plan)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(168, 85, 247, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <FileText size={40} style={{ color: '#a855f7' }} />
          </div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Rental Plans Yet</h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Create your first rental plan to define GPU pricing and resource allocations.
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Create First Plan
          </button>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '32px',
            width: '100%',
            maxWidth: '480px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Create New Plan</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '14px' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddPlan}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Plan Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Basic GPU, Pro GPU, Enterprise"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>vCPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.vcpu}
                    onChange={(e) => setFormData({ ...formData, vcpu: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ram_gb}
                    onChange={(e) => setFormData({ ...formData, ram_gb: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Price per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Daily: ${(parseFloat(formData.price_per_hour || 0) * 24).toFixed(2)} | 
                  Monthly: ${(parseFloat(formData.price_per_hour || 0) * 24 * 30).toFixed(2)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '32px',
            width: '100%',
            maxWidth: '480px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Edit Plan</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '14px' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleEditPlan}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>vCPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.vcpu}
                    onChange={(e) => setFormData({ ...formData, vcpu: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ram_gb}
                    onChange={(e) => setFormData({ ...formData, ram_gb: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Price per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_hour}
                  onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Daily: ${(parseFloat(formData.price_per_hour || 0) * 24).toFixed(2)} | 
                  Monthly: ${(parseFloat(formData.price_per_hour || 0) * 24 * 30).toFixed(2)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={28} style={{ color: '#ef4444' }} />
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Delete Plan?</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{selectedPlan.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeletePlan}>
                <Trash2 size={16} />
                Delete
                              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;

              
