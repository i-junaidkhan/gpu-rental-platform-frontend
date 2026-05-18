import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, FolderOpen, Box } from 'lucide-react';
import { getNamespaces, getPods } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const getNamespaceName = (ns) => typeof ns === 'string' ? ns : (ns?.name || '');

const Namespaces = () => {
  const [namespaces, setNamespaces] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [nsRes, podsRes] = await Promise.all([getNamespaces(), getPods()]);
      setNamespaces(asArray(nsRes.data, 'namespaces'));
      setPods(asArray(podsRes.data, 'pods'));
    } catch (error) {
      console.error('Error fetching namespace data:', error);
      setNamespaces([]); setPods([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const getPodsCount = (namespace) => pods.filter((p) => p?.namespace === getNamespaceName(namespace)).length;

  const getNamespaceType = (ns) => {
    const name = getNamespaceName(ns);
    if (name === 'kube-system' || name === 'kube-public' || name === 'kube-node-lease') return { label: 'System', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (name === 'default') return { label: 'Default', color: '#00d4aa', bg: 'rgba(0, 212, 170, 0.15)' };
    if (name.includes('monitoring') || name.includes('prometheus') || name.includes('grafana')) return { label: 'Monitoring', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (name.includes('gpu') || name.includes('rental')) return { label: 'GPU Rental', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
    return { label: 'Custom', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
  };

  const systemCount = namespaces.filter((ns) => getNamespaceType(ns).label === 'System').length;
  const customCount = namespaces.length - systemCount;

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Namespaces</h1><p>View all Kubernetes namespaces in your cluster</p></div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spinning' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-icon cyan"><FolderOpen size={24} /></div><div className="stat-content"><h3>{namespaces.length}</h3><p>Total Namespaces</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><HardDrive size={24} /></div><div className="stat-content"><h3>{systemCount}</h3><p>System Namespaces</p></div></div>
        <div className="stat-card"><div className="stat-icon purple"><Box size={24} /></div><div className="stat-content"><h3>{customCount}</h3><p>Custom Namespaces</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><Box size={24} /></div><div className="stat-content"><h3>{pods.length}</h3><p>Total Pods</p></div></div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {namespaces.map((ns, index) => {
          const name = getNamespaceName(ns);
          const nsType = getNamespaceType(ns);
          return (
            <div className="card" key={name || index}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{name || '—'}</h3>
                <span className="status-badge" style={{ backgroundColor: nsType.bg, color: nsType.color }}>{nsType.label}</span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Status: {ns?.status || 'Active'}</p>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Pods: {getPodsCount(ns)}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Namespace Details</h3></div>
        <div className="table-container"><table className="data-table">
          <thead><tr><th>Namespace</th><th>Type</th><th>Status</th><th>Pods</th><th>Created</th></tr></thead>
          <tbody>
            {namespaces.map((ns, index) => {
              const name = getNamespaceName(ns); const nsType = getNamespaceType(ns);
              return <tr key={name || index}><td style={{ fontWeight: 500 }}>{name || '—'}</td><td><span className="status-badge" style={{ backgroundColor: nsType.bg, color: nsType.color }}>{nsType.label}</span></td><td>{ns?.status || 'Active'}</td><td>{getPodsCount(ns)}</td><td style={{ color: '#9ca3af' }}>{ns?.created_at ? new Date(ns.created_at).toLocaleString() : '—'}</td></tr>;
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};

export default Namespaces;
