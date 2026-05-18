import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  Box,
  Activity,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getHealth, getNodes, getPods, getGpuInventory, getInstances } from '../services/api';

const asArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [pods, setPods] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
      try {
        const [healthRes, nodesRes, podsRes, gpusRes, instancesRes] = await Promise.all([
          getHealth(),
          getNodes(),
          getPods(),
          getGpuInventory(),
          getInstances()
        ]);

        const asArray = (data, key) => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.[key])) return data[key];
          return [];
        };

        const nodesArr = asArray(nodesRes.data, 'nodes');

        setHealth({
          database: healthRes.data?.database || 'unknown',
          kubernetes: nodesArr.length > 0 ? 'connected' : 'unknown',
        });
        setNodes(nodesArr);
        setPods(asArray(podsRes.data, 'pods'));
        setGpus(asArray(gpusRes.data, 'gpus'));
        setInstances(asArray(instancesRes.data, 'instances'));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  // Calculate stats
  const runningPods = pods.filter(p => p.status === 'Running').length;
  const availableGpus = gpus.filter(g => g.status === 'available').length;
  const activeInstances = instances.filter(i => i.status === 'running').length;

  // Mock usage data for chart (replace with real metrics later)
  const usageData = [
    { time: '00:00', gpu: 45, cpu: 30, memory: 55 },
    { time: '04:00', gpu: 52, cpu: 35, memory: 58 },
    { time: '08:00', gpu: 78, cpu: 65, memory: 72 },
    { time: '12:00', gpu: 85, cpu: 75, memory: 80 },
    { time: '16:00', gpu: 72, cpu: 60, memory: 68 },
    { time: '20:00', gpu: 65, cpu: 45, memory: 62 },
    { time: 'Now', gpu: 68, cpu: 50, memory: 65 },
  ];

  // GPU status distribution for pie chart
  const gpuStatusData = [
    { name: 'Available', value: availableGpus, color: '#10b981' },
    { name: 'Rented', value: gpus.filter(g => g.status === 'rented').length, color: '#a855f7' },
    { name: 'Maintenance', value: gpus.filter(g => g.status === 'maintenance').length, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your GPU rental cluster</p>
      </div>

      {/* Connection Status */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div className={`connection-status ${health?.database === 'connected' ? 'connected' : 'disconnected'}`}>
          <span className={`pulse ${health?.database === 'connected' ? 'green' : 'red'}`}></span>
          <span>Database: {health?.database || 'Unknown'}</span>
        </div>
        <div className={`connection-status ${health?.kubernetes === 'connected' ? 'connected' : 'disconnected'}`}>
          <span className={`pulse ${health?.kubernetes === 'connected' ? 'green' : 'red'}`}></span>
          <span>Kubernetes: {health?.kubernetes || 'Unknown'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <h3>{nodes.length}</h3>
            <p>Total Nodes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <h3>{gpus.length > 0 ? gpus.length : '—'}</h3>
            <p>Total GPUs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <h3>{availableGpus > 0 ? availableGpus : '—'}</h3>
            <p>Available GPUs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Box size={24} />
          </div>
          <div className="stat-content">
            <h3>{runningPods}</h3>
            <p>Running Pods</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{activeInstances > 0 ? activeInstances : '—'}</h3>
            <p>Active Instances</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{pods.length}</h3>
            <p>Total Pods</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Usage Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Resource Usage</h3>
              <p className="card-subtitle">GPU, CPU, and Memory over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={usageData}>
              <defs>
                <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1425',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="gpu"
                stroke="#00d4aa"
                fill="url(#gpuGradient)"
                strokeWidth={2}
                name="GPU %"
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#a855f7"
                fill="url(#cpuGradient)"
                strokeWidth={2}
                name="CPU %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* GPU Status Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">GPU Status Distribution</h3>
              <p className="card-subtitle">Current allocation status</p>
            </div>
          </div>
          {gpuStatusData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gpuStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gpuStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1425',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginLeft: '16px' }}>
                {gpuStatusData.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: '#6b7280' }}>
              <p>No GPU data available. Add GPUs to inventory.</p>
            </div>
          )}
        </div>
      </div>

      {/* Nodes Overview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Cluster Nodes</h3>
            <p className="card-subtitle">Status of all Kubernetes nodes</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Node Name</th>
                <th>Status</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>GPU</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '500' }}>{node.name}</td>
                  <td>
                    <span className={`status-badge ${node.status?.toLowerCase()}`}>
                      {node.status === 'Ready' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {node.status}
                    </span>
                  </td>
                  <td>{node.cpu} cores</td>
                  <td>{node.memory}</td>
                  <td>
                    <span style={{ color: node.gpu !== '0' ? '#00d4aa' : '#6b7280' }}>
                      {node.gpu !== '0' ? `${node.gpu} GPU(s)` : 'None'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
