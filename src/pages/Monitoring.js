import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Server, Cpu, Box, AlertTriangle } from 'lucide-react';
import { getMonitoringPods, getMonitoringNodes, getMonitoringGpus, getGpuInventory, getNodes } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const lower = (v) => String(v || '').toLowerCase();

const Monitoring = () => {
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setRefreshing(true);
    setError('');
    setFallbackUsed(false);
    try {
      const [podsRes, nodesRes, gpusRes] = await Promise.allSettled([
        getMonitoringPods(),
        getMonitoringNodes(),
        getMonitoringGpus()
      ]);

      const podRows = podsRes.status === 'fulfilled' ? asArray(podsRes.value.data, 'pods') : [];
      let nodeRows = nodesRes.status === 'fulfilled' ? asArray(nodesRes.value.data, 'nodes') : [];
      let gpuRows = gpusRes.status === 'fulfilled' ? asArray(gpusRes.value.data, 'gpus') : [];

      if (nodeRows.length === 0) {
        try {
          const fallbackNodes = await getNodes();
          nodeRows = asArray(fallbackNodes.data, 'nodes');
          if (nodeRows.length > 0) setFallbackUsed(true);
        } catch (e) {
          console.warn('Fallback /nodes failed', e);
        }
      }

      if (gpuRows.length === 0) {
        try {
          const fallbackGpu = await getGpuInventory();
          gpuRows = asArray(fallbackGpu.data, 'gpus');
          if (gpuRows.length > 0) setFallbackUsed(true);
        } catch (e) {
          console.warn('Fallback /gpu-inventory failed', e);
        }
      }

      setPods(podRows);
      setNodes(nodeRows);
      setGpus(gpuRows);

      if (nodesRes.status === 'rejected' || gpusRes.status === 'rejected') {
        setError('Some monitoring endpoints failed. Fallback data may be shown.');
      }
    } catch (err) {
      console.error('Monitoring fetch failed:', err);
      setError(err.message || 'Monitoring fetch failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const runningPods = pods.filter(p => lower(p.status) === 'running').length;
  const readyNodes = nodes.filter(n => n.ready === true || lower(n.status) === 'ready').length;
  const advertisedGpuRows = gpus.filter(g => Number(g.allocatable || g.available || 0) > 0).length;

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading monitoring...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Resource Monitoring</h1>
          <p>Pod, node, and GPU status from the live cluster. Empty GPU rows mean resources are not advertised or backend lacks node visibility.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {fallbackUsed && <div className="alert alert-success">Fallback cluster discovery data is being displayed.</div>}

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><Box size={24} /><div className="stat-content"><h3>{runningPods}/{pods.length}</h3><p>Running Instances</p></div></div>
        <div className="stat-card"><Server size={24} /><div className="stat-content"><h3>{readyNodes}/{nodes.length}</h3><p>Ready Nodes</p></div></div>
        <div className="stat-card"><Cpu size={24} /><div className="stat-content"><h3>{advertisedGpuRows}/{gpus.length}</h3><p>Advertised GPU Rows</p></div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title"><Server size={18} /> Nodes</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Ready</th><th>IP</th><th>CPU</th><th>Memory</th><th>GPU</th><th>MIG State</th></tr></thead>
            <tbody>
              {nodes.map((n, idx) => (
                <tr key={n.name || idx}>
                  <td>{n.name || '-'}</td>
                  <td><span className={`status-badge ${(n.ready === true || lower(n.status) === 'ready') ? 'running' : 'error'}`}>{n.ready === true || lower(n.status) === 'ready' ? 'Ready' : (n.status || 'Unknown')}</span></td>
                  <td>{n.internal_ip || n.host_ip || '-'}</td>
                  <td>{n.cpu || n.cpu_capacity || n.cpu_allocatable || '-'}</td>
                  <td>{n.memory || n.memory_capacity || n.memory_allocatable || '-'}</td>
                  <td>{n.gpu || n.gpu_capacity || n.gpu_allocatable || n.gpu_count_label || '0'}</td>
                  <td>{n.mig_state || '-'}</td>
                </tr>
              ))}
              {nodes.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No node monitoring data. Backend returned an empty list.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title"><Cpu size={18} /> GPU Resources</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Node</th><th>Resource</th><th>Capacity</th><th>Allocatable</th><th>Used</th><th>Product</th><th>Status</th></tr></thead>
            <tbody>
              {gpus.map((g, idx) => (
                <tr key={`${g.node_name || g.node || 'gpu'}-${g.resource_name || g.name || idx}`}>
                  <td>{g.node_name || g.node || '-'}</td>
                  <td>{g.resource_name || g.name || '-'}</td>
                  <td>{g.capacity ?? '-'}</td>
                  <td>{g.allocatable ?? g.available ?? '-'}</td>
                  <td>{g.used ?? '-'}</td>
                  <td>{g.product || '-'}</td>
                  <td>{g.status || '-'}</td>
                </tr>
              ))}
              {gpus.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}><AlertTriangle size={16} /> No GPU monitoring rows. If g01 has GPUs, check NVIDIA device-plugin/MIG state and backend node RBAC.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><Activity size={18} /> Instance Pods</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Pod</th><th>Project</th><th>User</th><th>Plan</th><th>Status</th><th>Cost</th></tr></thead>
            <tbody>
              {pods.map(p => (
                <tr key={p.instance_id || p.pod_name}>
                  <td>{p.instance_id}</td><td>{p.pod_name}</td><td>{p.project_id || '-'}</td><td>{p.user_id || '-'}</td><td>{p.plan_id || '-'}</td><td>{p.status}</td><td>${Number(p.accumulated_cost || 0).toFixed(2)}</td>
                </tr>
              ))}
              {pods.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No tracked instances</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
