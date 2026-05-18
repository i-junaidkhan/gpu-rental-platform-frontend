import React, { useState, useEffect } from 'react';
import {
  Box,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { getPods, getNamespaces } from '../services/api';

const asArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const getNamespaceName = (ns) => {
  if (typeof ns === 'string') return ns;
  return ns?.name || '';
};

const Pods = () => {
  const [pods, setPods] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [podsRes, nsRes] = await Promise.all([getPods(), getNamespaces()]);
      setPods(asArray(podsRes.data, 'pods'));
      setNamespaces(asArray(nsRes.data, 'namespaces'));
    } catch (error) {
      console.error('Error fetching pods data:', error);
      setPods([]);
      setNamespaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchData();

  const filteredPods = pods.filter((pod) => {
    const name = pod?.name || '';
    const namespace = pod?.namespace || '';
    const node = pod?.node || '';
    const term = searchTerm.toLowerCase();
    const namespaceMatch = selectedNamespace ? namespace === selectedNamespace : true;
    const searchMatch =
      name.toLowerCase().includes(term) ||
      namespace.toLowerCase().includes(term) ||
      node.toLowerCase().includes(term);
    return namespaceMatch && searchMatch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Running':
        return <CheckCircle size={14} />;
      case 'Pending':
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Running':
        return 'running';
      case 'Pending':
        return 'pending';
      case 'Succeeded':
        return 'available';
      default:
        return 'failed';
    }
  };

  const runningCount = pods.filter((p) => p?.status === 'Running').length;
  const pendingCount = pods.filter((p) => p?.status === 'Pending').length;
  const failedCount = pods.filter((p) => !['Running', 'Pending', 'Succeeded'].includes(p?.status)).length;

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Pods</h1>
          <p>View and manage all pods in your cluster</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-icon cyan"><Box size={24} /></div><div className="stat-content"><h3>{pods.length}</h3><p>Total Pods</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-content"><h3>{runningCount}</h3><p>Running</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Clock size={24} /></div><div className="stat-content"><h3>{pendingCount}</h3><p>Pending</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><AlertCircle size={24} /></div><div className="stat-content"><h3>{failedCount}</h3><p>Failed/Other</p></div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input type="text" placeholder="Search pods..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} style={{ color: '#6b7280' }} />
            <select value={selectedNamespace} onChange={(e) => setSelectedNamespace(e.target.value)} style={{ padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Namespaces</option>
              {namespaces.map((ns, index) => {
                const nsName = getNamespaceName(ns);
                return nsName ? <option key={index} value={nsName}>{nsName}</option> : null;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Pod List ({filteredPods.length})</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Pod Name</th><th>Namespace</th><th>Status</th><th>Node</th><th>Pod IP</th><th>Host IP</th></tr></thead>
            <tbody>
              {filteredPods.length > 0 ? filteredPods.map((pod, index) => (
                <tr key={`${pod?.namespace || 'ns'}-${pod?.name || index}`}>
                  <td style={{ fontWeight: '500' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={16} style={{ color: '#a855f7' }} /><span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pod?.name || '—'}</span></div></td>
                  <td><span className="status-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>{pod?.namespace || '—'}</span></td>
                  <td><span className={`status-badge ${getStatusClass(pod?.status)}`}>{getStatusIcon(pod?.status)}{pod?.status || 'Unknown'}</span></td>
                  <td style={{ color: '#9ca3af' }}>{pod?.node || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{pod?.pod_ip || pod?.ip || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{pod?.host_ip || '—'}</td>
                </tr>
              )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No pods found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pods;
