import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Keep backend array response usable in BOTH styles:
// 1) res.data as raw array
// 2) res.data.nodes / res.data.pods / res.data.projects etc.
const normalizeArrayResponse = async (promise, key) => {
  const res = await promise;

  if (Array.isArray(res.data)) {
    res.data[key] = res.data;
    return res;
  }

  if (!Array.isArray(res.data?.[key])) {
    res.data[key] = [];
  }

  return res;
};

const normalizeHealth = async (promise) => {
  const res = await promise;

  res.data = {
    ...res.data,
    database: res.data?.database || 'unknown',
    kubernetes: res.data?.kubernetes || 'connected',
  };

  return res;
};

// =========================
// Health
// =========================
export const getHealth = () =>
  normalizeHealth(api.get('/health'));

// =========================
// Nodes
// =========================
export const getNodes = () =>
  normalizeArrayResponse(api.get('/nodes'), 'nodes');

export const getNode = (name) =>
  api.get(`/nodes/${name}`);

export const createNode = (data) =>
  api.post('/nodes', data);

export const addNode = (data) =>
  api.post('/nodes', data);

export const updateNode = (name, data) =>
  api.put(`/nodes/${name}`, data);

export const deleteNode = (name) =>
  api.delete(`/nodes/${name}`);

export const removeNode = (name) =>
  api.delete(`/nodes/${name}`);

// =========================
// Pods
// =========================
export const getPods = () =>
  normalizeArrayResponse(api.get('/pods'), 'pods');

export const getPod = (namespace, name) =>
  api.get(`/pods/${namespace}/${name}`);

export const createPod = (data) =>
  api.post('/pods', data);

export const updatePod = (namespace, name, data) =>
  api.put(`/pods/${namespace}/${name}`, data);

export const deletePod = (namespace, name) =>
  api.delete(`/pods/${namespace}/${name}`);

export const startPod = (namespace, name) =>
  api.post(`/pods/${namespace}/${name}/start`);

export const stopPod = (namespace, name) =>
  api.post(`/pods/${namespace}/${name}/stop`);

export const restartPod = (namespace, name) =>
  api.post(`/pods/${namespace}/${name}/restart`);

export const getPodLogs = (namespace, name) =>
  api.get(`/pods/${namespace}/${name}/logs`);

export const getPodEvents = (namespace, name) =>
  api.get(`/pods/${namespace}/${name}/events`);

export const openPodPort = (namespace, name, data) =>
  api.post(`/pods/${namespace}/${name}/ports`, data);

export const closePodPort = (namespace, name, port) =>
  api.delete(`/pods/${namespace}/${name}/ports/${port}`);

// =========================
// Namespaces
// =========================
export const getNamespaces = () =>
  normalizeArrayResponse(api.get('/namespaces'), 'namespaces');

export const createNamespace = (data) =>
  api.post('/namespaces', data);

export const updateNamespace = (name, data) =>
  api.put(`/namespaces/${name}`, data);

export const deleteNamespace = (name) =>
  api.delete(`/namespaces/${name}`);

// =========================
// Services
// =========================
export const getServices = () =>
  normalizeArrayResponse(api.get('/services'), 'services');

export const getService = (namespace, name) =>
  api.get(`/services/${namespace}/${name}`);

export const createService = (data) =>
  api.post('/services', data);

export const updateService = (namespace, name, data) =>
  api.put(`/services/${namespace}/${name}`, data);

export const deleteService = (namespace, name) =>
  api.delete(`/services/${namespace}/${name}`);

// =========================
// GPU Inventory
// =========================
export const getGpuInventory = () =>
  normalizeArrayResponse(api.get('/gpu-inventory'), 'gpus');

export const getGpus = () =>
  normalizeArrayResponse(api.get('/gpu-inventory'), 'gpus');

export const createGpu = (data) =>
  api.post('/gpu-inventory', data);

export const updateGpu = (id, data) =>
  api.put(`/gpu-inventory/${id}`, data);

export const deleteGpu = (id) =>
  api.delete(`/gpu-inventory/${id}`);

// =========================
// Instances
// =========================
export const getInstances = () =>
  normalizeArrayResponse(api.get('/instances'), 'instances');

export const getInstance = (id) =>
  api.get(`/instances/${id}`);

export const createInstance = (data) =>
  api.post('/instances', data);

export const updateInstance = (id, data) =>
  api.put(`/instances/${id}`, data);

export const deleteInstance = (id) =>
  api.delete(`/instances/${id}`);

export const startInstance = (id) =>
  api.post(`/instances/${id}/start`);

export const stopInstance = (id) =>
  api.post(`/instances/${id}/stop`);

export const restartInstance = (id) =>
  api.post(`/instances/${id}/restart`);

export const instanceAction = (id, action) =>
  api.post(`/instances/${id}/action`, { action });

// =========================
// Users
// =========================
export const getUsers = (projectId = null) => {
  const params = projectId ? { project_id: projectId } : {};
  return normalizeArrayResponse(api.get('/users', { params }), 'users');
};

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const createUser = (data) =>
  api.post('/users', data);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);

// =========================
// Plans / Rental Plans
// =========================
export const getRentalPlans = () =>
  normalizeArrayResponse(api.get('/rental-plans'), 'plans');

export const getPlans = () =>
  normalizeArrayResponse(api.get('/rental-plans'), 'plans');

export const createRentalPlan = (data) =>
  api.post('/rental-plans', data);

export const createPlan = (data) =>
  api.post('/rental-plans', data);

export const updateRentalPlan = (id, data) =>
  api.put(`/rental-plans/${id}`, data);

export const updatePlan = (id, data) =>
  api.put(`/rental-plans/${id}`, data);

export const deleteRentalPlan = (id) =>
  api.delete(`/rental-plans/${id}`);

export const deletePlan = (id) =>
  api.delete(`/rental-plans/${id}`);

// =========================
// Billing
// =========================
export const getBillingEvents = () =>
  normalizeArrayResponse(api.get('/billing-events'), 'billingEvents');

export const getBilling = () =>
  normalizeArrayResponse(api.get('/billing-events'), 'billingEvents');

export const createBillingEvent = (data) =>
  api.post('/billing-events', data);

export const updateBillingEvent = (id, data) =>
  api.put(`/billing-events/${id}`, data);

export const deleteBillingEvent = (id) =>
  api.delete(`/billing-events/${id}`);

// =========================
// Storage Volumes
// =========================
export const getStorageVolumes = () =>
  normalizeArrayResponse(api.get('/storage-volumes'), 'volumes');

export const createStorageVolume = (data) =>
  api.post('/storage-volumes', data);

export const updateStorageVolume = (id, data) =>
  api.put(`/storage-volumes/${id}`, data);

export const deleteStorageVolume = (id) =>
  api.delete(`/storage-volumes/${id}`);

// =========================
// User Storages
// =========================
export const getUserStorages = (filters = {}) =>
  normalizeArrayResponse(api.get('/user-storages', { params: filters }), 'userStorages');

export const createUserStorage = (data) =>
  api.post('/user-storages', data);

export const updateUserStorage = (id, data) =>
  api.put(`/user-storages/${id}`, data);

export const deleteUserStorage = (id) =>
  api.delete(`/user-storages/${id}`);

export const updateUserStorageQuota = (id, quota_gb) =>
  api.put(`/user-storages/${id}/quota`, { quota_gb });

// =========================
// Port Setting / Port Management
// Kept for old pages even if tab is removed.
// =========================
export const getPortSettings = () =>
  normalizeArrayResponse(api.get('/port-settings'), 'portSettings');

export const createPortSetting = (data) =>
  api.post('/port-settings', data);

export const updatePortSetting = (id, data) =>
  api.put(`/port-settings/${id}`, data);

export const deletePortSetting = (id) =>
  api.delete(`/port-settings/${id}`);

export const openPort = (data) =>
  api.post('/ports/open', data);

export const closePort = (data) =>
  api.post('/ports/close', data);


// =========================
// Projects (Enterprise Tenants)
// =========================
export const getProjects = () =>
  normalizeArrayResponse(api.get('/projects'), 'projects');

export const getProject = (id) =>
  api.get(`/projects/${id}`);

export const getProjectSummary = (id) =>
  api.get(`/projects/${id}/summary`);

export const createProject = (data) =>
  api.post('/projects', data);

export const updateProject = (id, data) =>
  api.put(`/projects/${id}`, data);

export const deleteProject = (id) =>
  api.delete(`/projects/${id}`);


// =========================
// Instance Port / App Access
// =========================
export const getInstancePorts = (instanceId) =>
  normalizeArrayResponse(api.get(`/instances/${instanceId}/ports`), 'ports');

export const openInstancePort = (instanceId, data) =>
  api.post(`/instances/${instanceId}/ports`, data);

export const closeInstancePort = (instanceId, portId) =>
  api.delete(`/instances/${instanceId}/ports/${portId}`);

export const getInstanceLaunch = (instanceId) =>
  api.get(`/instances/${instanceId}/launch`);

// =========================
// Monitoring
// =========================
export const getMonitoringPods = () =>
  normalizeArrayResponse(api.get('/monitoring/pods'), 'pods');

export const getMonitoringNodes = () =>
  normalizeArrayResponse(api.get('/monitoring/nodes'), 'nodes');

export const getMonitoringGpus = () =>
  normalizeArrayResponse(api.get('/monitoring/gpus'), 'gpus');

// =========================
// Billing Usage
// =========================
export const getBillingUsageRaw = () =>
  normalizeArrayResponse(api.get('/billing/usage/raw'), 'usage');

export const getBillingUsageSummary = (period = 'daily') =>
  api.get('/billing/usage/summary', { params: { period } });

// =========================
// Generic export
// =========================
export default api;