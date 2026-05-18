import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Save
} from 'lucide-react';
import { getBillingEvents, createBillingEvent, getUsers } from '../services/api';

const Billing = () => {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    event_type: 'payment',
    amount: 0,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, usersRes] = await Promise.all([
        getBillingEvents(),
        getUsers()
      ]);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data.events || eventsRes.data.billingEvents || []));
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      user_id: '',
      event_type: 'payment',
      amount: 0,
      description: ''
    });
    setFormError('');
    setFormSuccess('');
  };

  // Open Add Modal
  const openAddModal = () => {
    resetForm();
    if (users.length > 0) {
      setFormData(prev => ({ ...prev, user_id: users[0].id }));
    }
    setShowAddModal(true);
  };

  // Handle Add Billing Event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.user_id || !formData.amount) {
      setFormError('Please select a user and enter an amount');
      return;
    }

    try {
      const payload = {
        user_id: parseInt(formData.user_id),
        event_type: formData.event_type,
        amount: parseFloat(formData.amount),
        description: formData.description || null
      };

      await createBillingEvent(payload);
      setFormSuccess('Billing event created successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchData();
        resetForm();
      }, 1000);
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create billing event');
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get event type style
  const getEventTypeStyle = (type) => {
    switch (type) {
      case 'payment':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: ArrowUpRight };
      case 'charge':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: ArrowDownRight };
      case 'refund':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: ArrowUpRight };
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', icon: DollarSign };
    }
  };

  // Calculate totals
  const totalPayments = events
    .filter(e => e.event_type === 'payment')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalCharges = events
    .filter(e => e.event_type === 'charge')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalRefunds = events
    .filter(e => e.event_type === 'refund')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netRevenue = totalPayments - totalRefunds;

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
          <h1>Billing</h1>
          <p>Track payments, charges, and billing events</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>${totalPayments.toFixed(2)}</h3>
            <p>Total Payments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>${totalCharges.toFixed(2)}</h3>
            <p>Total Charges</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>${totalRefunds.toFixed(2)}</h3>
            <p>Total Refunds</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3 style={{ color: netRevenue >= 0 ? '#10b981' : '#ef4444' }}>
              ${netRevenue.toFixed(2)}
            </h3>
            <p>Net Revenue</p>
          </div>
        </div>
      </div>

      {/* Events Table or Empty State */}
      {events.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Billing Events ({events.length})</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => {
                  const typeStyle = getEventTypeStyle(event.event_type);
                  const TypeIcon = typeStyle.icon;
                  return (
                    <tr key={index}>
                      <td style={{ fontWeight: '500' }}>#{event.id}</td>
                      <td>{getUserName(event.user_id)}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                          <TypeIcon size={12} />
                          {event.event_type}
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: '600', 
                        color: event.event_type === 'payment' ? '#10b981' : 
                               event.event_type === 'charge' ? '#ef4444' : '#f59e0b'
                      }}>
                        {event.event_type === 'charge' ? '-' : '+'}${event.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ color: '#9ca3af', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.description || '—'}
                      </td>
                      <td style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {formatDate(event.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(0, 212, 170, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CreditCard size={40} style={{ color: '#00d4aa' }} />
          </div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Billing Events Yet</h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Record payments, charges, and refunds to track your GPU rental revenue.
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add First Event
          </button>
        </div>
      )}

      {/* Add Billing Event Modal */}
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
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Add Billing Event</h2>
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

            <form onSubmit={handleAddEvent}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>User *</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} (Balance: ${user.balance?.toFixed(2) || '0.00'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Event Type *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="payment">Payment (Add to balance)</option>
                  <option value="charge">Charge (Deduct from balance)</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  placeholder="0.00"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Monthly subscription, GPU usage charge"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
