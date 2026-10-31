import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';

const cardStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};
const titleStyle = { marginBottom: '15px', fontSize: '16px', color: '#333' };

const VERDICT_META = [
  { key: 'safe', name: 'Safe', color: '#10B981' },
 
  { key: 'phishing', name: 'Phishing', color: '#EF4444' },
];

const KIND_META = [
  { key: 'url', name: 'URLs', color: '#3B82F6' },
  { key: 'email', name: 'Emails', color: '#8B5CF6' },
  { key: 'message', name: 'Messages', color: '#14B8A6' },
];

export default function ScanAnalytics({ stats }) {
  if (!stats) return null;

  const lineData = stats.daily || [];

  const pieData = VERDICT_META.map((m) => ({
    name: m.name,
    value: stats.by_verdict?.[m.key] || 0,
    color: m.color,
  })).filter((d) => d.value > 0); // hide empty slices

  const kindData = KIND_META.map((m) => ({
    name: m.name,
    count: stats.by_kind?.[m.key] || 0,
    color: m.color,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '25px' }}>

      {/* Line Chart: Scan Volume (last 7 days) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Scan Volume Over the Last 7 Days</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Results Distribution */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Results Distribution</h3>
        <div style={{ width: '100%', height: 250 }}>
          {pieData.length === 0 ? (
            <p style={{ color: '#6B7280', textAlign: 'center', paddingTop: '90px' }}>
              No scans yet.
            </p>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar Chart: Scans by type */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Scans by Type</h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={kindData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {kindData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}