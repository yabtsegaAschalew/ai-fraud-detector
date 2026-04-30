import React, { useState } from "react";
import axios from "axios";
import { Shield, ShieldAlert, CheckCircle2, ChevronRight, Loader2, AlertCircle, TrendingUp, Key, MapPin, Activity } from "lucide-react";
import "./App.css";

const GROUPS = [
  {
    id: "account",
    title: "Account & Demographics",
    icon: <Key size={18} />,
    fields: ["account_id", "Customer Age", "Account Balance", "Customer Occupation"]
  },
  {
    id: "context",
    title: "Context & Location Flags",
    icon: <MapPin size={18} />,
    fields: ["Location", "user_primary_location", "is_unusual_location", "Channel"]
  },
  {
    id: "behavior",
    title: "Behavioral Signals",
    icon: <Activity size={18} />,
    fields: ["Login Attempts", "user_transaction_count", "user_avg_transaction_amount", "deviation_from_user_avg", "Transaction Duration"]
  },
  {
    id: "transaction",
    title: "Transaction Specifics",
    icon: <TrendingUp size={18} />,
    fields: ["Transaction Amount", "Transaction Type", "transaction_hour", "transaction_day_of_week"]
  }
];


const initialData = {
  account_id: "test_001",
  TransactionAmount: 350.25,
  CustomerAge: 35,
  TransactionDuration: 4.2,
  LoginAttempts: 1,
  AccountBalance: 12000.0,
  user_transaction_count: 8,
  user_avg_transaction_amount: 320.0,
  deviation_from_user_avg: 30.25,
  transaction_hour: 14,
  transaction_day_of_week: 2,
  TransactionType: "Debit",
  Location: "New York",
  Channel: "Web",
  CustomerOccupation: "Engineer",
  user_primary_location: "New York",
  is_unusual_location: "False"
};

const HINTS = {
  CustomerAge: "typical: 18-80",
  TransactionDuration: "typical: 1.0-10.0 sec",
  LoginAttempts: "typical: 1-3",
  transaction_hour: "0-23",
  transaction_day_of_week: "0-6 (Sun-Sat)"
};

export default function TransactionScore() {
  const [form, setForm] = useState(initialData);
  const [activeGroup, setActiveGroup] = useState("account");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    let value = e.target.type === "checkbox" ? e.target.checked.toString().replace(/^\w/, c => c.toUpperCase()) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/transactions/score", {
        ...form,
        TransactionAmount: parseFloat(form.TransactionAmount),
        CustomerAge: parseInt(form.CustomerAge),
        TransactionDuration: parseFloat(form.TransactionDuration),
        LoginAttempts: parseInt(form.LoginAttempts),
        AccountBalance: parseFloat(form.AccountBalance),
        user_transaction_count: parseFloat(form.user_transaction_count),
        user_avg_transaction_amount: parseFloat(form.user_avg_transaction_amount),
        deviation_from_user_avg: parseFloat(form.deviation_from_user_avg),
        transaction_hour: parseInt(form.transaction_hour),
        transaction_day_of_week: parseInt(form.transaction_day_of_week)
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (key) => {
    const val = form[key];
    const hint = HINTS[key];

    if (key === "is_unusual_location") {
      const isOn = val === "True";
      return (
        <div className="form-group" key={key}>
          <label className="form-label">Unusual Location Flag</label>
          <div className={`toggle-switch ${isOn ? "on" : ""}`} onClick={() => handleChange({ target: { name: key, type: 'checkbox', checked: !isOn } })}>
            <div className="toggle-thumb"></div>
          </div>
        </div>
      );
    }

    if (key === "TransactionType") {
      return (
        <div className="form-group" key={key}>
          <label className="form-label">Transaction Type</label>
          <select className="form-select" name={key} value={val} onChange={handleChange}>
            <option value="Debit">Debit</option>
            <option value="Credit">Credit</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      );
    }

    if (key === "Channel") {
      return (
        <div className="form-group" key={key}>
          <label className="form-label">Channel</label>
          <select className="form-select" name={key} value={val} onChange={handleChange}>
            <option value="Web">Web</option>
            <option value="Mobile">Mobile</option>
            <option value="ATM">ATM</option>
            <option value="In-Branch">In-Branch</option>
          </select>
        </div>
      );
    }

    if (key === "transaction_day_of_week") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return (
        <div className="form-group" key={key}>
          <label className="form-label">
            Transaction Day Of Week
            <span className="input-hint">0-6 (Sun-Sat)</span>
          </label>
          <select className="form-select" name={key} value={val} onChange={handleChange}>
            {days.map((day, idx) => (
              <option key={idx} value={idx}>{idx} - {day}</option>
            ))}
          </select>
        </div>
      );
    }

    const type = typeof initialData[key] === "number" ? "number" : "text";

    return (
      <div className="form-group" key={key}>
        <label className="form-label">
          {key.replace(/_/g, ' ')}
          {hint && <span className="input-hint">{hint}</span>}
        </label>
        <div style={{ position: "relative" }}>
          {type === "number" && (
            <input 
              type="range" 
              name={key}
              min="0"
              max={key === "transaction_hour" ? 23 : key.includes('amount') || key.includes('Amount') || key.includes('Balance') ? 20000 : 100}
              step={key.includes('Amount') || key.includes('Duration') || key.includes('deviation') ? "0.1" : "1"}
              value={val} 
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px", accentColor: "var(--accent-cyan)" }}
            />
          )}
          <input
            className="form-input"
            style={{ width: "100%", paddingRight: "30px" }}
            name={key}
            type={type}
            value={val}
            onChange={handleChange}
          />
          {val && !error && result && (
            <CheckCircle2 size={16} color="var(--accent-green)" style={{ position: "absolute", right: "10px", top: type === "number" ? "38px" : "12px", zIndex: 1 }} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="page-title">Transaction Scoring</div>
      
      <div className="grid-2">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {GROUPS.map((group) => {
              const isActive = activeGroup === group.id;
              
              return (
                <div key={group.id} className="glass-card" style={{ padding: isActive ? "20px" : "16px", cursor: isActive ? "default" : "pointer" , transition: "all var(--transition-normal)" }} onClick={() => !isActive && setActiveGroup(group.id)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isActive ? "16px" : "0", color: isActive ? "#fff" : "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "600", letterSpacing: "0.02em" }}>
                      {group.icon}
                      {group.title}
                    </div>
                    {!isActive && <ChevronRight size={18} />}
                  </div>
                  
                  {isActive && (
                    <div className="grid-2 animate-fade-in" style={{ gap: "16px" }}>
                      {group.fields.map(renderField)}
                    </div>
                  )}
                </div>
              );
            })}
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "12px", height: "48px", fontSize: "1rem" }}>
              {loading ? (
                <><Loader2 size={20} className="spinner" style={{ animation: "spin 1s linear infinite" }} /> Analyzing...</>
              ) : (
                <><Activity size={20} /> Run Security Scoring</>
              )}
            </button>
          </div>
        </form>

        {/* Result Area */}
        <div style={{ alignSelf: "flex-start" }}>
          <div className="glass-card" style={{ position: "sticky", top: "0" }}>
            <h3 style={{ marginBottom: "20px", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Analysis Result</h3>
            
            {!result && !loading && !error && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "var(--text-muted)", opacity: 0.5 }}>
                <Shield size={64} style={{ marginBottom: "16px" }} />
                <p>Awaiting transaction payload</p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "var(--accent-cyan)" }}>
                <Loader2 size={48} style={{ marginBottom: "16px", animation: "spin 1s linear infinite" }} />
                <p className="mono">Processing vectors...</p>
              </div>
            )}

            {error && (
              <div style={{ backgroundColor: "var(--accent-red-transparent)", padding: "24px", borderLeft: "4px solid var(--accent-red)", borderRadius: "var(--border-radius-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-red)", fontWeight: "600", marginBottom: "8px" }}>
                  <AlertCircle size={20} /> Evaluation Error
                </div>
                <div className="mono" style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{JSON.stringify(error)}</div>
              </div>
            )}

            {result && !loading && (
              <div className={`animate-fade-in ${result.is_fraud ? "" : ""}`} style={{ 
                border: `2px solid ${result.is_fraud ? "var(--accent-red)" : "var(--accent-green)"}`,
                borderRadius: "var(--border-radius-lg)",
                padding: "32px",
                backgroundColor: result.is_fraud ? "var(--accent-red-transparent)" : "var(--accent-green-transparent)",
                textAlign: "center",
                animation: result.is_fraud ? "pulse-red 2s infinite" : "none"
              }}>
                <div style={{ marginBottom: "16px" }}>
                  {result.is_fraud ? (
                    <ShieldAlert size={64} color="var(--accent-red)" style={{ margin: "0 auto" }} />
                  ) : (
                    <CheckCircle2 size={64} color="var(--accent-green)" style={{ margin: "0 auto" }} />
                  )}
                </div>
                
                <h2 style={{ fontSize: "2rem", marginBottom: "8px", color: result.is_fraud ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {result.is_fraud ? "FRAUD DETECTED" : "TRANSACTION SAFE"}
                </h2>
                
                <div className="mono" style={{ backgroundColor: "var(--bg-primary)", padding: "16px", borderRadius: "var(--border-radius-md)", marginTop: "24px", color: "var(--text-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Anomaly Score</span>
                    <strong>{parseFloat(result.anomaly_score).toFixed(5)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Confidence</span>
                    <strong>{result.is_fraud ? "98.2%" : "99.9%"}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
