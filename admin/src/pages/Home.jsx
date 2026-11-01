import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ScanAnalytics from '../components/ScanAnalytics';
import { getStats, listScans } from '../api';

// Accepts a number or an object like {total, safe, phishing}
const count = (v) => (v && typeof v === 'object' ? v.total ?? 0 : v ?? 0);

const VERDICT_STYLE = {
  safe: { bg: '#dcfce7', fg: '#166534', label: 'Safe' },
  
  phishing: { bg: '#fee2e2', fg: '#991b1b', label: 'Phishing' },
};

const KIND_LABEL = { url: 'Domain / URL', email: 'Email', message: 'Message' };

const css = `
  .dash-card { transition: transform .2s ease, box-shadow .2s ease; }
  .dash-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(15,23,42,.12); }
  .dash-row:hover { background: #f8fafc; }
  .dash-btn { transition: background .15s ease; }
  .dash-btn:hover { background: rgba(255,255,255,.28); }
  @keyframes dash-pulse {
    0% { box-shadow: 0 0 0 0 rgba(52,211,153,.7); }
    70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); }
    100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  }
`;

const card = {
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 2px 8px rgba(15,23,42,.07)',
  padding: 22,
};

// Numbers count up from 0 when the page loads
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function Sparkline({ data, color = '#fff' }) {
  if (!data || data.length < 2) return null;
  const w = 110;
  const h = 34;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.9" />
    </svg>
  );
}

function KpiCard({ label, value, icon, from, to, spark }) {
  const shown = useCountUp(value);
  return (
    <div
      className="dash-card"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: '#fff',
        borderRadius: 14,
        padding: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        minHeight: 116,
      }}
    >
      <div>
        <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{shown.toLocaleString()}</div>
      </div>
      <Sparkline data={spark} />
    </div>
  );
}

function ThreatRing({ percent }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(percent, 100) / 100) * c;
  const level = percent < 20 ? 'Low' : percent < 50 ? 'Medium' : 'High';
  const color = percent < 20 ? '#10B981' : percent < 50 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150 }}>
        <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="75" cy="75" r={r} fill="none" stroke="#eef2f7" strokeWidth="14" />
          <circle
            cx="75" cy="75" r={r} fill="none" stroke={color} strokeWidth="14"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset .8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#1F2937' }}>{percent}%</span>
          <span style={{ fontSize: 12, color: '#6B7280' }}>of scans</span>
        </div>
      </div>
      <span style={{ marginTop: 10, padding: '4px 14px', borderRadius: 999, background: `${color}22`, color, fontWeight: 600, fontSize: 13 }}>
        {level} threat level
      </span>
    </div>
  );
}

function TypeBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: '#374151' }}>
        <span>{label}</span>
        <span style={{ color: '#6B7280' }}>{value} · {pct}%</span>
      </div>
      <div style={{ height: 9, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .8s ease' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, scans] = await Promise.all([
        getStats(),
        listScans({ limit: 6 }).catch(() => ({ items: [] })),
      ]);
      setStats(s);
      setRecent(scans.items || []);
      setUpdatedAt(new Date());
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // auto refresh every 30 seconds
    return () => clearInterval(timer);
  }, [load]);

  if (error && !stats) {
    return <div style={{ padding: 20, color: '#EF4444' }}>{error}</div>;
  }
  if (!stats) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading dashboard metrics...</div>;
  }

  const totalScans = count(stats.total_scans);
  const totalUsers = count(stats.total_users);
  const phishing = count(stats.by_verdict?.phishing);
   
  const threats = stats.threats ?? phishing ;
  const threatPct = totalScans > 0 ? Math.round((threats / totalScans) * 100) : 0;

  const urlCount = count(stats.by_kind?.url);
  const emailCount = count(stats.by_kind?.email);
  const messageCount = count(stats.by_kind?.message);
  const dailyScans = (stats.daily || []).map((d) => d.scans);

  return (
    <div style={{ padding: 20, background: '#f4f7fb', minHeight: '100%' }}>
      <style>{css}</style>

      {/* Hero banner */}
      <div
        style={{
          background: 'linear-gradient(120deg, #0f172a 0%, #1e3a8a 55%, #0e7490 100%)',
          color: '#fff',
          borderRadius: 16,
          padding: '26px 28px',
          marginBottom: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Control Panel</h1>
          
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#34d399', animation: 'dash-pulse 1.8s infinite' }} />
            Live{updatedAt ? ` · ${updatedAt.toLocaleTimeString()}` : ''}
          </span>
          <button
            className="dash-btn"
            onClick={load}
            disabled={refreshing}
            style={{ background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '8px 16px', borderRadius: 8, cursor: refreshing ? 'wait' : 'pointer' }}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18, marginBottom: 22 }}>
        <KpiCard label="Total Scans" value={totalScans} icon="🔍" from="#2563eb" to="#1e40af" spark={dailyScans} />
        <KpiCard label="Detected Threats" value={threats} icon="🛡️" from="#ef4444" to="#b91c1c" />
        <KpiCard label="Total Users" value={totalUsers} icon="👥" from="#8b5cf6" to="#6d28d9" />
        <KpiCard label="Safe Results" value={count(stats.by_verdict?.safe)} icon="✅" from="#10b981" to="#047857" />
      </div>

      {/* Threat level + scans by type */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 22 }}>
        <div className="dash-card" style={card}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, color: '#333' }}>Threat Level</h3>
          <ThreatRing percent={threatPct} />
        </div>

        <div className="dash-card" style={card}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, color: '#333' }}>Scans by Type</h3>
          <TypeBar label="🌐 Domains / URLs" value={urlCount} total={totalScans} color="#3B82F6" />
          <TypeBar label="✉️ Emails" value={emailCount} total={totalScans} color="#8B5CF6" />
          <TypeBar label="💬 Messages" value={messageCount} total={totalScans} color="#14B8A6" />
        </div>
      </div>

      {/* Charts */}
      <ScanAnalytics stats={stats} />

      {/* Latest scans */}
      <div className="dash-card" style={card}>
        <h3 style={{ margin: '0 0 14px', fontSize: 16, color: '#333' }}>Latest Scans</h3>
        {recent.length === 0 ? (
          <p style={{ color: '#6B7280' }}>No scans yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6B7280', borderBottom: '2px solid #eef2f7' }}>
                  <th style={{ padding: 10 }}>User</th>
                  <th style={{ padding: 10 }}>Type</th>
                  <th style={{ padding: 10 }}>Content</th>
                  <th style={{ padding: 10 }}>Result</th>
                  <th style={{ padding: 10 }}>Risk</th>
                  <th style={{ padding: 10 }}>Date</th>
                  <th style={{ padding: 10 }} />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => {
                  console.log(s)
                  const v = VERDICT_STYLE[s.label] || { bg: '#e5e7eb', fg: '#374151', label: s.label || '—' };
                  return (
                    <tr key={s.id} className="dash-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 10 }}>{s.user_name}</td>
                      <td style={{ padding: 10 }}>{KIND_LABEL[s.kind] || s.kind}</td>
                      <td style={{ padding: 10, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7280' }}>
                        {s.preview}
                      </td>
                      <td style={{ padding: 10 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: v.bg, color: v.fg }}>
                          {v.label}
                        </span>
                      </td>
                      <td style={{ padding: 10 }}>{Math.round(s.score ?? 0)}%</td>
                      <td style={{ padding: 10, fontSize: 12, color: '#6B7280' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: 10 }}>
                        <Link to={`/scans/${s.id}`} style={{ color: '#2563eb', fontSize: 13 }}>View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}