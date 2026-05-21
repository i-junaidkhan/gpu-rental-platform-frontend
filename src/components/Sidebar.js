import React from 'react';


import {
  LayoutDashboard,
  Server,
  Cpu,
  Box,
  Users,
  CreditCard,
  FileText,
  Settings,
  Activity,
  HardDrive,
  Layers,
  Briefcase,
  Plug
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'gpus', label: 'GPU Inventory', icon: Cpu },
    { id: 'pods', label: 'Pods', icon: Box },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'namespaces', label: 'Namespaces', icon: HardDrive },
    { id: 'storage', label: 'Storage', icon: HardDrive },
  ];

  const managementItems = [
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'instances', label: 'Instances', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'plans', label: 'Rental Plans', icon: FileText },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
  ];

  const systemItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavItems = (items) => {
    return items.map((item) => {
      const Icon = item.icon;
      return (
        <div
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => setActivePage(item.id)}
        >
          <Icon size={20} />
          <span>{item.label}</span>
        </div>
      );
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>GPU Rental</h1>
        <span>Kubernetes Platform</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Cluster</div>
          {renderNavItems(navItems)}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          {renderNavItems(managementItems)}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">System</div>
          {renderNavItems(systemItems)}
        </div>
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
        <div className="connection-status connected">
          <span className="pulse green"></span>
          <span>Cluster Connected</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
