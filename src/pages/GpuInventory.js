import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, CheckCircle, Wrench, Server } from 'lucide-react';
import { getGpuInventory, getNodes } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const n = (value) => Number(value || 0);

const GpuInventory = () => {
  const [gpus, setGpus] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [gpusRes, nodesRes] = await Promise.all([getGpuInventory(), getNodes()]);
      setGpus(asArray(gpusRes.data, 'gpus'));
      setNodes(asArray(nodesRes.data, 'nodes'));
    } catch (error) {
      console.error('Error fetching GPU inventory:', error);
      setGpus([]); setNodes([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const totalCapacity = gpus.reduce((sum, g) => sum + n(g?.capacity), 0);
  const totalAvailable = gpus.reduce((sum, g) => sum + n(g?.available), 0);
  const totalUsed = gpus.reduce((sum, g) => sum + n(g?.used), 0);
  const unavailableRows = gpus.filter((g) => g?.status !== 'available').length;

  const getStatusClass = (status) => status === 'available' ? 'available' : (status === 'maintenance' ? 'pending' : 'failed');
  const getStatusIcon = (status) => status === 'available' ? <CheckCircle size={14} /> : <Wrench size={14} />;

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>GPU Inventory</h1><p>Kubernetes-advertised GPU resource inventory</p></div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spinning' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-icon cyan"><Cpu size={24} /></div><div className="stat-content"><h3>{totalCapacity}</h3><p>Total Capacity</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-content"><h3>{totalAvailable}</h3><p>Available</p></div></div>
        <div className="stat-card"><div className="stat-icon purple"><Server size={24} /></div><div className="stat-content"><h3>{totalUsed}</h3><p>Used</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><Wrench size={24} /></div><div className="stat-content"><h3>{unavailableRows}</h3><p>Unavailable Rows</p></div></div>
      </div>

      {totalCapacity === 0 && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>GPU resources are not currently advertised by Kubernetes</h3>
          <p style={{ color: '#9ca3af' }}>The backend is reachable, but Kubernetes reports zero capacity for GPU/MIG resources. Check NVIDIA device plugin, MIG manager, and GPU operator state on g01.</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title">Resource Classes</h3></div>
        <div className="table-container"><table className="data-table">
          <thead><tr><th>Name</th><th>Node</th><th>Resource</th><th>Product</th><th>Capacity</th><th>Used</th><th>Available</th><th>Allocatable</th><th>Status</th></tr></thead>
          <tbody>
            {gpus.length > 0 ? gpus.map((gpu, index) => (
              <tr key={gpu?.id || gpu?.resource_name || index}>
                <td style={{ fontWeight: 500 }}>{gpu?.name || '—'}</td>
                <td>{gpu?.node_name || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{gpu?.resource_name || '—'}</td>
                <td>{gpu?.product || '—'}</td>
                <td>{n(gpu?.capacity)}</td><td>{n(gpu?.used)}</td><td>{n(gpu?.available)}</td><td>{n(gpu?.allocatable)}</td>
                <td><span className={`status-badge ${getStatusClass(gpu?.status)}`}>{getStatusIcon(gpu?.status)}{gpu?.status || 'unknown'}</span></td>
              </tr>
            )) : <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No GPU resources found</td></tr>}
          </tbody>
        </table></div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Nodes ({nodes.length})</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Status</th><th>Internal IP</th><th>Runtime</th></tr></thead><tbody>{nodes.map((node, index) => <tr key={node?.name || index}><td>{node?.name || '—'}</td><td>{node?.status || '—'}</td><td>{node?.internal_ip || node?.ip || '—'}</td><td>{node?.container_runtime || '—'}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
};

export default GpuInventory;
