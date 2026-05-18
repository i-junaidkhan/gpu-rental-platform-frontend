import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Globe, Lock, Server, ExternalLink } from 'lucide-react';
import { getServices, getNamespaces } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const getNamespaceName = (ns) => typeof ns === 'string' ? ns : (ns?.name || '');
const formatPort = (port) => {
  if (!port || typeof port !== 'object') return String(port || '—');
  const servicePort = port.port ?? '—';
  const target = port.target_port ? `→${port.target_port}` : '';
  const node = port.node_port ? ` node:${port.node_port}` : '';
  const protocol = port.protocol || 'TCP';
  return `${servicePort}${target}/${protocol}${node}`;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [svcRes, nsRes] = await Promise.all([getServices(), getNamespaces()]);
      setServices(asArray(svcRes.data, 'services'));
      setNamespaces(asArray(nsRes.data, 'namespaces'));
    } catch (error) {
      console.error('Error fetching services data:', error);
      setServices([]); setNamespaces([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LoadBalancer': return <Globe size={14} />;
      case 'NodePort': return <ExternalLink size={14} />;
      case 'ClusterIP': return <Lock size={14} />;
      default: return <Server size={14} />;
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'LoadBalancer': return { backgroundColor: 'rgba(0, 212, 170, 0.15)', color: '#00d4aa' };
      case 'NodePort': return { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' };
      case 'ClusterIP': return { backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' };
      default: return { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280' };
    }
  };

  const filteredServices = selectedNamespace ? services.filter((s) => s?.namespace === selectedNamespace) : services;
  const clusterIPCount = services.filter((s) => s?.type === 'ClusterIP').length;
  const nodePortCount = services.filter((s) => s?.type === 'NodePort').length;
  const loadBalancerCount = services.filter((s) => s?.type === 'LoadBalancer').length;

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Services</h1><p>View all Kubernetes services in your cluster</p></div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spinning' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-icon cyan"><Layers size={24} /></div><div className="stat-content"><h3>{services.length}</h3><p>Total Services</p></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Lock size={24} /></div><div className="stat-content"><h3>{clusterIPCount}</h3><p>ClusterIP</p></div></div>
        <div className="stat-card"><div className="stat-icon purple"><ExternalLink size={24} /></div><div className="stat-content"><h3>{nodePortCount}</h3><p>NodePort</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><Globe size={24} /></div><div className="stat-content"><h3>{loadBalancerCount}</h3><p>LoadBalancer</p></div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>Filter by Namespace:</span>
          <select value={selectedNamespace} onChange={(e) => setSelectedNamespace(e.target.value)} style={{ padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
            <option value="">All Namespaces</option>
            {namespaces.map((ns, index) => { const nsName = getNamespaceName(ns); return nsName ? <option key={index} value={nsName}>{nsName}</option> : null; })}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Service List ({filteredServices.length})</h3></div>
        <div className="table-container"><table className="data-table">
          <thead><tr><th>Service Name</th><th>Namespace</th><th>Type</th><th>Cluster IP</th><th>Ports</th></tr></thead>
          <tbody>
            {filteredServices.length > 0 ? filteredServices.map((svc, index) => (
              <tr key={`${svc?.namespace || 'ns'}-${svc?.name || index}`}>
                <td style={{ fontWeight: '500' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={16} style={{ color: '#00d4aa' }} />{svc?.name || '—'}</div></td>
                <td><span className="status-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>{svc?.namespace || '—'}</span></td>
                <td><span className="status-badge" style={getTypeClass(svc?.type)}>{getTypeIcon(svc?.type)}{svc?.type || 'Unknown'}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{svc?.cluster_ip || '—'}</td>
                <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{asArray(svc?.ports, 'ports').map((port, pIndex) => <span key={pIndex} style={{ padding: '2px 8px', backgroundColor: 'rgba(0, 212, 170, 0.1)', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{formatPort(port)}</span>)}</div></td>
              </tr>
            )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No services found</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};

export default Services;
