import React, { useState, useEffect } from 'react';
import {
  getNodeSummary,
  getGpuPods,
  getAllPods,
  createGpuPod,
  deleteGpuPod,
  getPodStatus,
  execPodGpuCheck,
  getPodLogs,
  getNodeGpuResources
} from '../services/api';

function PortSetting() {
  const [nodeSummary, setNodeSummary] = useState([]);
  const [gpuPods, setGpuPods] = useState([]);
  const [allPods, setAllPods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [output, setOutput] = useState('');
  const [outputTitle, setOutputTitle] = useState('실행 결과');
  const [showAllPods, setShowAllPods] = useState(false);

  // Form state
  const [podName, setPodName] = useState('gpu-test-1');
  const [namespace, setNamespace] = useState('default');
  const [nodeName, setNodeName] = useState('g01');
  const [gpuType, setGpuType] = useState('MIG');
  const [gpuCount, setGpuCount] = useState(1);
  const [restartPolicy, setRestartPolicy] = useState('Always');
  const [image, setImage] = useState('docker.io/nvidia/cuda:12.4.0-base-ubuntu22.04');
  const [command, setCommand] = useState('sleep infinity');

  // Sanitize name function
  const sanitizeName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/^-+|-+$/g, '');
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, podsRes] = await Promise.all([
        getNodeSummary(nodeName),
        getGpuPods()
      ]);
      setNodeSummary(summaryRes.data.summary || []);
      setGpuPods(podsRes.data.pods || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Load all pods
  const loadAllPods = async () => {
    try {
      const res = await getAllPods();
      setAllPods(res.data.pods || []);
    } catch (error) {
      console.error('Error loading all pods:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
    loadAllPods();
  }, []);

  // Auto-refresh
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData();
        loadAllPods();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Show output
  const showOutput = (title, content) => {
    setOutputTitle(title);
    setOutput(content);
  };

  // Handle create pod
  const handleCreatePod = async () => {
    const sanitizedPodName = sanitizeName(podName);
    const sanitizedNamespace = sanitizeName(namespace);
    const sanitizedNodeName = sanitizeName(nodeName);

    const podConfig = {
      pod_name: sanitizedPodName,
      namespace: sanitizedNamespace,
      node_name: sanitizedNodeName,
      gpu_type: gpuType,
      gpu_count: parseInt(gpuCount),
      restart_policy: restartPolicy,
      image: image,
      command: command
    };

    try {
      const res = await createGpuPod(podConfig);
      showOutput('Pod 생성 결과', JSON.stringify(res.data, null, 2));
      loadData();
    } catch (error) {
      showOutput('Pod 생성 오류', error.response?.data?.detail || error.message);
    }
  };

  // Handle delete pod
  const handleDeletePod = async () => {
    const sanitizedPodName = sanitizeName(podName);
    const sanitizedNamespace = sanitizeName(namespace);

    try {
      const res = await deleteGpuPod(sanitizedNamespace, sanitizedPodName);
      showOutput('Pod 삭제 결과', JSON.stringify(res.data, null, 2));
      loadData();
    } catch (error) {
      showOutput('Pod 삭제 오류', error.response?.data?.detail || error.message);
    }
  };

  // Handle pod status
  const handlePodStatus = async () => {
    const sanitizedPodName = sanitizeName(podName);
    const sanitizedNamespace = sanitizeName(namespace);

    try {
      const res = await getPodStatus(sanitizedNamespace, sanitizedPodName);
      showOutput('Pod 상태', JSON.stringify(res.data, null, 2));
    } catch (error) {
      showOutput('Pod 상태 오류', error.response?.data?.detail || error.message);
    }
  };

  // Handle exec GPU check
  const handleExecGpu = async () => {
    const sanitizedPodName = sanitizeName(podName);
    const sanitizedNamespace = sanitizeName(namespace);

    try {
      const res = await execPodGpuCheck(sanitizedNamespace, sanitizedPodName);
      showOutput('Pod 내부 GPU 상태', res.data.output || res.data.logs || 'No output');
    } catch (error) {
      showOutput('GPU 확인 오류', error.response?.data?.detail || error.message);
    }
  };

  // Handle view all pods
  const handleViewAllPods = async () => {
    await loadAllPods();
    setShowAllPods(true);
    showOutput('전체 Pod 리스트', `총 ${allPods.length}개의 Pod가 실행 중입니다.`);
  };

  // Handle view GPU pods
  const handleViewGpuPods = async () => {
    await loadData();
    const podList = gpuPods.map(p => 
      `${p.namespace}/${p.pod} - ${p.status} - GPU: ${p.gpu}`
    ).join('\n');
    showOutput('GPU Pod 리스트', podList || 'GPU 사용 Pod 없음');
  };

  // Handle view logs
  const handleViewLogs = async () => {
    const sanitizedPodName = sanitizeName(podName);
    const sanitizedNamespace = sanitizeName(namespace);

    try {
      const res = await getPodLogs(sanitizedNamespace, sanitizedPodName);
      showOutput('Pod 로그', res.data.logs || 'No logs available');
    } catch (error) {
      showOutput('로그 조회 오류', error.response?.data?.detail || error.message);
    }
  };

  // Handle node GPU resources
  const handleNodeResources = async () => {
    try {
      const res = await getNodeGpuResources(nodeName);
      showOutput('노드 GPU 리소스', res.data.resources || 'No data');
    } catch (error) {
      showOutput('리소스 조회 오류', error.response?.data?.detail || error.message);
    }
  };

  const maxGpu = gpuType === 'MIG' ? 7 : 8;

  return (
    <div>
      <div className="page-header">
        <h1>Pod-GPU Assignment Dashboard</h1>
        <p>Kubernetes GPU / MIG / Time-slicing control panel</p>
      </div>

      {/* Refresh Controls */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={loadData}>
            상태 수동 갱신
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>자동 갱신 10초</span>
          </label>
        </div>
      </div>

      {/* Dashboard Section */}
      <h2 style={{ marginBottom: '16px' }}>현재 클러스터 GPU 상태</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Node Summary */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Node Resource Summary</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>값</th>
                </tr>
              </thead>
              <tbody>
                {nodeSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.item}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* GPU Pods */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>GPU Pods</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Namespace</th>
                  <th>Pod</th>
                  <th>Node</th>
                  <th>Status</th>
                  <th>GPU</th>
                </tr>
              </thead>
              <tbody>
                {gpuPods.length > 0 ? (
                  gpuPods.map((pod, idx) => (
                    <tr key={idx}>
                      <td>{pod.namespace}</td>
                      <td>{pod.pod}</td>
                      <td>{pod.node}</td>
                      <td>{pod.status}</td>
                      <td>{pod.gpu}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>GPU 사용 Pod 없음</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pod Creation Form */}
      <h2 style={{ marginBottom: '16px' }}>Pod 생성</h2>
      
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>Pod 이름</label>
            <input
              type="text"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              placeholder="gpu-test-1"
            />
          </div>

          <div className="form-group">
            <label>Namespace</label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="default"
            />
          </div>

          <div className="form-group">
            <label>Node</label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="g01"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>GPU 타입</label>
            <select value={gpuType} onChange={(e) => setGpuType(e.target.value)}>
              <option value="MIG">MIG (격리형)</option>
              <option value="Shared">Shared GPU (Time-slicing)</option>
            </select>
          </div>

          <div className="form-group">
            <label>GPU 개수</label>
            <input
              type="number"
              min="1"
              max={maxGpu}
              value={gpuCount}
              onChange={(e) => setGpuCount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Restart Policy</label>
            <select value={restartPolicy} onChange={(e) => setRestartPolicy(e.target.value)}>
              <option value="Always">Always</option>
              <option value="Never">Never</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Docker 이미지</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="docker.io/nvidia/cuda:12.4.0-base-ubuntu22.04"
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label>실행 명령</label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="sleep infinity"
            style={{ width: '100%' }}
          />
        </div>

        {gpuType === 'Shared' && (
          <div className="alert alert-warning" style={{ marginTop: '16px' }}>
            ⚠️ Time-slicing은 동일 GPU를 여러 Pod가 시간 공유합니다. MIG처럼 메모리/성능 격리가 보장되지는 않습니다.
          </div>
        )}
      </div>

      {/* Pod Controls */}
      <h2 style={{ marginBottom: '16px' }}>Pod 제어</h2>
      
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button className="btn-primary" onClick={handleCreatePod}>
            Pod 생성
          </button>
          <button className="btn-danger" onClick={handleDeletePod}>
            Pod 삭제
          </button>
          <button className="btn-secondary" onClick={handlePodStatus}>
            Pod 상태 확인
          </button>
          <button className="btn-secondary" onClick={handleExecGpu}>
            Exec GPU 확인
          </button>
        </div>
      </div>

      {/* Operations */}
      <h2 style={{ marginBottom: '16px' }}>운영 조회</h2>
      
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleViewAllPods}>
            전체 Pod 리스트
          </button>
          <button className="btn-secondary" onClick={handleViewGpuPods}>
            GPU Pod 리스트
          </button>
          <button className="btn-secondary" onClick={handleViewLogs}>
            Pod 로그 보기
          </button>
          <button className="btn-secondary" onClick={handleNodeResources}>
            노드 GPU 리소스
          </button>
        </div>
      </div>

      {/* All Pods Table */}
      {showAllPods && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>전체 Pod 상태 테이블</h3>
            <button className="btn-secondary" onClick={() => setShowAllPods(false)}>
              닫기
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Namespace</th>
                <th>Pod</th>
                <th>Status</th>
                <th>Node</th>
              </tr>
            </thead>
            <tbody>
              {allPods.map((pod, idx) => (
                <tr key={idx}>
                  <td>{pod.namespace}</td>
                  <td>{pod.pod}</td>
                  <td>{pod.status}</td>
                  <td>{pod.node}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Output Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>{outputTitle}</h3>
        <pre style={{
          backgroundColor: '#1a1a2e',
          color: '#d8fff5',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '400px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {output || '명령 실행 결과가 여기에 표시됩니다.'}
        </pre>
      </div>
    </div>
  );
}

export default PortSetting;
