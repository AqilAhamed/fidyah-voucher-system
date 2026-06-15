import React, { useEffect, useState } from 'react';
import { getStats } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(console.error);
  }, []);

  if (!stats) return <p>Loading...</p>;

  const cards = [
    { label: 'Total Beneficiaries', value: stats.total_users },
    { label: 'Approved Merchants',  value: stats.approved_merchants },
    { label: 'Total Vouchers',      value: stats.total_vouchers },
    { label: 'Vouchers Redeemed',   value: stats.redeemed_vouchers },
    { label: 'Pending Payout ($)',  value: `$${stats.pending_payout}` },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Quick Start</h3>
        <p style={{ color: '#555', lineHeight: 1.7 }}>
          Use <strong>Beneficiaries</strong> to register users and issue vouchers.<br/>
          Use <strong>Merchants</strong> to approve registered businesses.<br/>
          Use <strong>Ledger &amp; Payouts</strong> to track and settle redemptions.
        </p>
      </div>
    </div>
  );
}
