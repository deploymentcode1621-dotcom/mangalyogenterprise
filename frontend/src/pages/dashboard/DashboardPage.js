import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI, sitesAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, sitesRes] = await Promise.all([
          transactionsAPI.summary(),
          sitesAPI.getAll(),
        ]);
        setSummary(sumRes.data);
        setSites(sitesRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 15, color: '#64748b' }}>Loading dashboard...</div>
    </div>
  );

  const chartData = [
    { name: 'Money IN', amount: summary?.totalIn || 0, fill: '#16a34a' },
    { name: 'Money OUT', amount: summary?.totalOut || 0, fill: '#dc2626' },
    { name: 'Balance', amount: summary?.balance || 0, fill: '#1e40af' },
  ];

  const activeSites = sites.filter((s) => s.status === 'active').length;

  return (
    <div>
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Money IN"
          value={formatCurrency(summary?.totalIn)}
          icon="💚"
          color="#16a34a"
        />
        <StatCard
          label="Total Money OUT"
          value={formatCurrency(summary?.totalOut)}
          icon="🔴"
          color="#dc2626"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(summary?.balance)}
          icon="💰"
          color="#1e40af"
          sub={summary?.balance >= 0 ? 'Positive' : 'Negative'}
        />
        <StatCard
          label="Active Sites"
          value={activeSites}
          icon="🏗️"
          color="#d97706"
          sub={`${sites.length} total`}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
            Financial Overview
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}
                fill="#1e40af"
                label={false}
              >
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Recent Transactions</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/transactions')}>
              View All
            </button>
          </div>
          {(summary?.recentTransactions || []).length === 0 ? (
            <div className="empty-state">
              <div className="icon">💸</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div>
              {summary.recentTransactions.slice(0, 7).map((txn) => (
                <div key={txn._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{txn.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {txn.siteId?.name || 'N/A'} · {formatDate(txn.date)}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: 14,
                    color: txn.type === 'IN' ? '#16a34a' : '#dc2626',
                  }}>
                    {txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sites Overview */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Sites Overview</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/sites')}>
            Manage Sites
          </button>
        </div>
        {sites.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏗️</div>
            <p>No sites added yet</p>
          </div>
        ) : (
          <div className="grid-3">
            {sites.slice(0, 6).map((site) => (
              <div
                key={site._id}
                onClick={() => navigate(`/sites/${site._id}`)}
                style={{
                  padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#1e40af'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{site.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{site.address}</div>
                  </div>
                  <span className={`badge ${site.status === 'active' ? 'badge-in' : 'badge-out'}`}
                    style={{ fontSize: 11 }}>
                    {site.status}
                  </span>
                </div>
                {site.projectName && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>📁 {site.projectName}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
