import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getNodes } from '../services/api';

const Nodes = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const response = await getNodes();
      setNodes(response.data.nodes || []);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNodes();
  };

  // Parse memory string (e.g., "32Gi" -> "32 GB")
  const formatMemory = (memory) => {
    if (!memory) return 'Unknown';
    const match = memory.match(/(\d+)(\w+)/);
    if (match) {
      const value = match[1];
      const unit = match[2];
      if (unit === 'Ki') return `${Math.round(value / 1024 / 1024)} GB`;
      if (unit === 'Mi') return `${Math.round(value / 1024)} GB`;
      if (unit === 'Gi') return `${value} GB`;
    }
    return memory;
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
          <h1>Cluster Nodes</h1>
          <p>Manage and monitor your Kubernetes cluster nodes</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Node Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
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
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{nodes.filter(n => n.status === 'Ready').length}</h3>
            <p>Ready Nodes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <h3>{nodes.reduce((sum, n) => sum + parseInt(n.cpu || 0), 0)}</h3>
            <p>Total CPU Cores</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <h3>{nodes.filter(n => n.gpu !== '0').length}</h3>
            <p>GPU Nodes</p>
          </div>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid-3">
        {nodes.map((node, index) => (
          <div className="card" key={index}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`stat-icon ${node.status === 'Ready' ? 'green' : 'red'}`} style={{ width: '40px', height: '40px' }}>
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="card-title">{node.name}</h3>
                  <span className={`status-badge ${node.status?.toLowerCase()}`}>
                    {node.status === 'Ready' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {node.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              {/* CPU */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>CPU Cores</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{node.cpu}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', backgroundColor: '#00d4aa', borderRadius: '3px' }}></div>
                </div>
              </div>

              {/* Memory */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>Memory</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{formatMemory(node.memory)}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: '#a855f7', borderRadius: '3px' }}></div>
                </div>
              </div>

              {/* GPU */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>GPU</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: node.gpu !== '0' ? '#00d4aa' : '#6b7280' }}>
                    {node.gpu !== '0' ? `${node.gpu} GPU(s)` : 'None'}
                  </span>
                </div>
                {node.gpu !== '0' && (
                  <div style={{ height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '30%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nodes Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Node Details</h3>
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
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} style={{ color: '#00d4aa' }} />
                      {node.name}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${node.status?.toLowerCase()}`}>
                      {node.status === 'Ready' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {node.status}
                    </span>
                  </td>
                  <td>{node.cpu} cores</td>
                  <td>{formatMemory(node.memory)}</td>
                  <td>
                    <span style={{ color: node.gpu !== '0' ? '#00d4aa' : '#6b7280' }}>
                      {node.gpu !== '0' ? `${node.gpu} GPU(s)` : 'None'}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                      {node.name === 'm01' ? 'Master' : 'Worker'}
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

export default Nodes;
