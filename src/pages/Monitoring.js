import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Server, Cpu, Box } from 'lucide-react';
import { getMonitoringPods, getMonitoringNodes, getMonitoringGpus } from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);

const Monitoring = () => {
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [podsRes, nodesRes, gpusRes] = await Promise.all([
        getMonitoringPods(),
        getMonitoringNodes(),
        getMonitoringGpus()
      ]);
      setPods(asArray(podsRes.data, 'pods'));
      setNodes(asArray(nodesRes.data, 'nodes'));
      setGpus(asArray(gpusRes.data, 'gpus'));
    } catch (error) {
      console.error('Monitoring fetch failed:', error);
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

  const runningPods = pods.filter(p => String(p.status).toLowerCase() === 'running').length;
  const readyNodes = nodes.filter(n => n.ready).length;
  const availableGpuRows = gpus.filter(g => Number(g.allocatable || 0) > 0).length;

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading monitoring...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Resource Monitoring</h1>
          <p>Pod, node, and GPU status from the live cluster</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><Box size={24} /><div className="stat-content"><h3>{runningPods}/{pods.length}</h3><p>Running Instances</p></div></div>
        <div className="stat-card"><Server size={24} /><div className="stat-content"><h3>{readyNodes}/{nodes.length}</h3><p>Ready Nodes</p></div></div>
        <div className="stat-card"><Cpu size={24} /><div className="stat-content"><h3>{availableGpuRows}</h3><p>GPU Resource Rows Available</p></div></div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title"><Server size={18} /> Nodes</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Ready</th><th>IP</th><th>CPU</th><th>Memory</th><th>GPU</th></tr></thead>
            <tbody>
              {nodes.map(n => (
                <tr key={n.name}>
                  <td>{n.name}</td>
                  <td><span className={`status-badge ${n.ready ? 'running' : 'error'}`}>{n.ready ? 'Ready' : 'NotReady'}</span></td>
                  <td>{n.internal_ip || '-'}</td>
                  <td>{n.cpu || '-'}</td>
                  <td>{n.memory || '-'}</td>
                  <td>{n.gpu || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title"><Cpu size={18} /> GPU Resources</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Node</th><th>Resource</th><th>Capacity</th><th>Allocatable</th><th>Product</th><th>Status</th></tr></thead>
            <tbody>
              {gpus.map((g, idx) => (
                <tr key={`${g.node_name}-${g.resource_name}-${idx}`}>
                  <td>{g.node_name}</td>
                  <td>{g.resource_name}</td>
                  <td>{g.capacity}</td>
                  <td>{g.allocatable}</td>
                  <td>{g.product || '-'}</td>
                  <td>{g.status}</td>
                </tr>
              ))}
              {gpus.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No GPU resources found</td></tr>}
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
                <tr key={p.instance_id}>
                  <td>{p.instance_id}</td>
                  <td>{p.pod_name}</td>
                  <td>{p.project_id || '-'}</td>
                  <td>{p.user_id}</td>
                  <td>{p.plan_id}</td>
                  <td>{p.status}</td>
                  <td>${Number(p.accumulated_cost || 0).toFixed(2)}</td>
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
