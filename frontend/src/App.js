import React, { useState, useEffect } from "react";
import { Shield, Activity, FileText } from "lucide-react";
import TransactionScore from "./TransactionScore.jsx";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [online] = useState(true);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const int = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield className="brand-icon" />
          <span className="brand-text">Aegis Fraud Ops</span>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'score' ? 'active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            <FileText size={18} />
            <span>Score Transaction</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-status">
            <div className={`status-dot ${online ? 'online' : 'offline'}`}></div>
            <span>System {online ? 'Online' : 'Offline'}</span>
          </div>
          <div className="header-actions">
            <div className="header-time">{timeStr}</div>
          </div>
        </header>

        <div className="content-scroll">
          {activeTab === 'dashboard' ? <Dashboard /> : <TransactionScore />}
        </div>
      </main>
    </div>
  );
}

export default App;