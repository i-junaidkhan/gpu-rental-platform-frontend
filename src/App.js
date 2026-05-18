import React, { useState } from 'react';
import './styles/global.css';
import Projects from './pages/Projects';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Pods from './pages/Pods';
import GpuInventory from './pages/GpuInventory';
import Services from './pages/Services';
import Namespaces from './pages/Namespaces';
import Instances from './pages/Instances';
import Users from './pages/Users';
import Plans from './pages/Plans';
import Billing from './pages/Billing';
import Storage from './pages/Storage';

//import PortSetting from './pages/PortSetting';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  // Render the active page
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'nodes':
        return <Nodes />;
      case 'pods':
        return <Pods />;
      case 'gpus':
        return <GpuInventory />;
      case 'services':
        return <Services />;
      case 'namespaces':
        return <Namespaces />;
      case 'projects':
        return <Projects />;
      case 'instances':
        return <Instances />;
      case 'users':
        return <Users />;
      case 'plans':
        return <Plans />;
      case 'billing':
        return <Billing />;
      case 'storage':
        return <Storage />;

      //case 'port-setting':
        //return <PortSetting />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

// Placeholder for Settings page
const SettingsPlaceholder = () => (
  <div>
    <div className="page-header">
      <h1>Settings</h1>
      <p>Configure your GPU rental platform</p>
    </div>
    <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        backgroundColor: 'rgba(168, 85, 247, 0.15)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '32px'
      }}>
        ⚙️
      </div>
      <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Coming Soon</h3>
      <p style={{ color: '#9ca3af', maxWidth: '400px', margin: '0 auto' }}>
        Settings and configuration options are under development.
      </p>
    </div>
  </div>
);

export default App;
