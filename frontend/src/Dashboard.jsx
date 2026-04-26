import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertOctagon, CheckCircle2, ShieldAlert, X, AlertTriangle, Info, Clock, MapPin, Database, Activity, Bell } from "lucide-react";
import "./App.css";

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/transactions/history");
        setTransactions(response.data.slice(0, 50)); // Last 50 for dashboard
        setLoading(false);
      } catch (err) {
        setTransactions([]);
        setLoading(false);
      }
    };
    fetchTransactions();
    
    // Auto-refresh every 10s
    const int = setInterval(fetchTransactions, 10000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    // Generate alerts from high-risk transactions
    const newAlerts = transactions
      .filter((tx) => tx.is_fraud === true)
      .map((tx, idx) => {
        let severity = "HIGH";
        if (tx.fraud_probability > -0.1) severity = "CRITICAL";
        return {
          id: `alert_${tx.id || tx.transaction_id || idx}`,
          transaction_id: tx.id || tx.transaction_id || idx,
          account_id: tx.account_id,
          type: severity,
          time: tx.event_time,
          message: `Suspicious activity detected near ${tx.location}`,
          score: tx.fraud_probability
        };
      });
      
    // Only update if alerts changed (simple hack by length or merging)
    setAlerts((prev) => {
      const prevIds = new Set(prev.map(a => a.id));
      const fresh = newAlerts.filter(a => !prevIds.has(a.id));
      return [...fresh, ...prev];
    });
  }, [transactions]);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "CRITICAL": return <AlertOctagon size={18} color="var(--accent-red)" />;
      case "HIGH": return <AlertTriangle size={18} color="var(--accent-amber)" />;
      default: return <Info size={18} color="var(--accent-cyan)" />;
    }
  };

  const ScoreBar = ({ score }) => {
    if (score === null || score === undefined) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PENDING</span>
        </div>
      );
    }

    const clamped = Math.max(-0.4, Math.min(0.2, score || 0));
    const range = 0.6; 
    const riskPercent = 100 - ((clamped + 0.4) / range) * 100;
    
    const isFraud = riskPercent > 60;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${riskPercent}%`, 
            backgroundColor: isFraud ? 'var(--accent-red)' : 'var(--accent-cyan)',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{riskPercent.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-title">Operations Dashboard</div>
      
      <div className="grid-2">
        <div className="glass-card" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={20} color="var(--accent-cyan)" /> 
            Recent Transactions
          </h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  <th style={{ padding: "12px 16px" }}>TxID</th>
                  <th style={{ padding: "12px 16px" }}>Account</th>
                  <th style={{ padding: "12px 16px" }}>Amount</th>
                  <th style={{ padding: "12px 16px" }}>Time</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: "16px" }}>
                          <div style={{ height: "16px", backgroundColor: "var(--border)", borderRadius: "4px", width: j === 5 ? "100px" : "100%", opacity: 0.5, animation: "pulse 1.5s infinite" }}></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
                      <Database size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
                      <p>No recent transactions recorded in the system.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr 
                      key={tx.id || tx.transaction_id || Math.random()} 
                      style={{ 
                        borderBottom: "1px solid var(--border)", 
                        transition: "background-color var(--transition-fast)" 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {(tx.id || tx.transaction_id || "N/A").toString().substring(0, 8)}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)" }}>{tx.account_id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>${parseFloat(tx.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {new Date(tx.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          backgroundColor: tx.is_fraud === null ? "var(--bg-elevated)" : (tx.is_fraud ? "var(--accent-red-transparent)" : "var(--accent-green-transparent)"),
                          color: tx.is_fraud === null ? "var(--text-muted)" : (tx.is_fraud ? "var(--accent-red)" : "var(--accent-green)"),
                        }}>
                          {tx.is_fraud === null ? <Clock size={12} /> : (tx.is_fraud ? <ShieldAlert size={12} /> : <CheckCircle2 size={12} />)}
                          {tx.is_fraud === null ? "PENDING" : (tx.is_fraud ? "FRAUD" : "SAFE")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <ScoreBar score={tx.fraud_probability} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={20} color="var(--accent-amber)" /> 
            Active Alerts
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "var(--border-radius-md)" }}>
                <CheckCircle2 size={32} style={{ margin: "0 auto 12px", color: "var(--accent-green)", opacity: 0.5 }} />
                <p>System clean. No active alerts to display.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} style={{ 
                  display: "flex",
                  alignItems: "stretch",
                  backgroundColor: "var(--bg-elevated)",
                  borderRadius: "var(--border-radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border)"
                }}>
                  <div style={{ 
                    width: "4px", 
                    backgroundColor: alert.type === "CRITICAL" ? "var(--accent-red)" : "var(--accent-amber)" 
                  }}></div>
                  
                  <div style={{ display: "flex", padding: "16px", flex: 1, gap: "16px", alignItems: "center" }}>
                    <div style={{ 
                      width: "40px", height: "40px", 
                      borderRadius: "50%", 
                      backgroundColor: alert.type === "CRITICAL" ? "var(--accent-red-transparent)" : "rgba(245, 158, 11, 0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center" 
                    }}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ color: alert.type === "CRITICAL" ? "var(--accent-red)" : "var(--accent-amber)" }}>
                          {alert.type} 
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px"}} />
                          {new Date(alert.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem" }}>
                        Transaction <strong>{alert.transaction_id}</strong> (Account <strong>{alert.account_id}</strong>) <br/>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", display: "inline-block" }}>
                          <MapPin size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/>
                          {alert.message}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => dismissAlert(alert.id)}
                      style={{ 
                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", 
                        padding: "8px", borderRadius: "50%", transition: "all var(--transition-fast)" 
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--border)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;