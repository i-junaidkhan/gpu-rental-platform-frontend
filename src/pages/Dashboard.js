import React, { useEffect, useState } from 'react';
import { Server, Cpu, Box, Activity, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import {
  getHealth,
  getMonitoringPods,
  getMonitoringNodes,
  getMonitoringGpus,
  getInstances,
  getProjects,
  getUsers,
  getStorageVolumes,
  getUserStorages
} from '../services/api';

const asArray = (data, key) => Array.isArray(data) ? data : (Array.isArray(data?.[key]) ? data[key] : []);
const lower = (v) => String(v || '').toLowerCase();

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [instances, setInstances] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setRefreshing(true);
    setError('');
    try {
      const [healthRes, podsRes, nodesRes, gpusRes, instancesRes, projectsRes, usersRes, volumesRes, storagesRes] = await Promise.allSettled([
        getHealth(),
        getMonitoringPods(),
        getMonitoringNodes(),
        getMonitoringGpus(),
        getInstances(),
        getProjects(),
        getUsers(),
        getStorageVolumes(),
        getUserStorages()
      ]);

      const getData = (res) => res.status === 'fulfilled' ? res.value.data : null;

      const h = getData(healthRes);
      const p = asArray(getData(podsRes), 'pods');
      const n = asArray(getData(nodesRes), 'nodes');
      const g = asArray(getData(gpusRes), 'gpus');

      setHealth(h || { status: 'unknown', database: 'unknown' });
      setPods(p);
      setNodes(n);
      setGpus(g);
      setInstances(asArray(getData(instancesRes), 'instances'));
      setProjects(asArray(getData(projectsRes), 'projects'));
      setUsers(asArray(getData(usersRes), 'users'));
      setVolumes(asArray(getData(volumesRes), 'volumes'));
      setStorages(asArray(getData(storagesRes), 'userStorages'));

      const failed = [podsRes, nodesRes, gpusRes, instancesRes, projectsRes, usersRes, volumesRes, storagesRes]
        .filter(r => r.status === 'rejected').length;
      if (failed > 0) setError(`${failed} dashboard data request(s) failed. Check backend/network logs.`);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      setError(err.message || 'Dashboard fetch failed');
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
  const activeInstances = instances.filter(i => lower(i.status) === 'running').length;
  const readyNodes = nodes.filter(n => n.ready === true || lower(n.status) === 'ready').length;
  const gpuAdvertised = gpus.reduce((sum, g) => sum + Number(g.allocatable || g.gpu_allocatable || g.available || 0), 0);
  const gpuPhysical = gpus.reduce((sum, g) => sum + Number(g.physical_count || g.gpu_count_label || 0), 0);
  const storageAllocated = storages.reduce((sum, s) => sum + Number(s.quota_gb || 0), 0);

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading dashboard...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Stable overview of projects, pods, storage, and GPU advertisement status</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className={`connection-status ${health?.database === 'connected' ? 'connected' : 'disconnected'}`}>
          <span className={`pulse ${health?.database === 'connected' ? 'green' : 'red'}`}></span>
          <span>Database: {health?.database || 'unknown'}</span>
        </div>
        <div className={`connection-status ${nodes.length > 0 ? 'connected' : 'disconnected'}`}>
          <span className={`pulse ${nodes.length > 0 ? 'green' : 'red'}`}></span>
          <span>Kubernetes Nodes: {nodes.length > 0 ? 'visible' : 'not visible to backend'}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><Server size={24} /><div className="stat-content"><h3>{readyNodes}/{nodes.length}</h3><p>Ready Nodes</p></div></div>
        <div className="stat-card"><Cpu size={24} /><div className="stat-content"><h3>{gpuAdvertised || 0}</h3><p>Advertised GPU Slots</p></div></div>
        <div className="stat-card"><AlertTriangle size={24} /><div className="stat-content"><h3>{gpuPhysical || '—'}</h3><p>Physical GPUs From Labels</p></div></div>
        <div className="stat-card"><Box size={24} /><div className="stat-content"><h3>{runningPods}/{pods.length}</h3><p>Tracked Running Pods</p></div></div>
        <div className="stat-card"><Activity size={24} /><div className="stat-content"><h3>{activeInstances}/{instances.length}</h3><p>Active Instances</p></div></div>
        <div className="stat-card"><Database size={24} /><div className="stat-content"><h3>{storageAllocated} GB</h3><p>Allocated Storage</p></div></div>
      </div>

      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Platform Summary</h3></div>
          <div className="table-container">
            <table className="data-table"><tbody>
              <tr><td>Projects</td><td>{projects.length}</td></tr>
              <tr><td>Users</td><td>{users.length}</td></tr>
              <tr><td>Storage Volumes</td><td>{volumes.length}</td></tr>
              <tr><td>User Storage Allocations</td><td>{storages.length}</td></tr>
              <tr><td>GPU Monitoring Rows</td><td>{gpus.length}</td></tr>
            </tbody></table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">GPU Advertisement Status</h3></div>
          {gpus.length === 0 ? (
            <div style={{ padding: '20px', color: '#f59e0b' }}>
              Backend returned no GPU monitoring rows. This usually means Kubernetes GPU resources are not visible to the backend or the NVIDIA device plugin/MIG advertisement is not healthy. Check /api/gpu-inventory and gpu-operator pods.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Node</th><th>Resource</th><th>Capacity</th><th>Allocatable</th><th>Status</th></tr></thead>
                <tbody>{gpus.slice(0, 6).map((g, idx) => (
                  <tr key={`${g.node_name}-${g.resource_name}-${idx}`}>
                    <td>{g.node_name || '-'}</td><td>{g.resource_name || '-'}</td><td>{g.capacity ?? '-'}</td><td>{g.allocatable ?? '-'}</td><td>{g.status || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header"><h3 className="card-title">Recent Instance State</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Pod</th><th>Project</th><th>User</th><th>Plan</th><th>Status</th></tr></thead>
            <tbody>
              {pods.slice(0, 10).map(p => (
                <tr key={p.instance_id || p.pod_name}>
                  <td>{p.instance_id}</td><td>{p.pod_name}</td><td>{p.project_id || '-'}</td><td>{p.user_id || '-'}</td><td>{p.plan_id || '-'}</td><td>{p.status}</td>
                </tr>
              ))}
              {pods.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No tracked pods/instances.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
