import React, { useEffect, useState } from 'react';
import { getLedger, markPaidOut, getPhysicalVoucherPDF } from '../api/api';

export default function LedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [msg, setMsg]       = useState('');

  const load = () => getLedger().then(r => setLedger(r.data.ledger)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handlePayout = async (merchantId, name) => {
    if (!window.confirm(`Mark all pending payouts for ${name} as paid?`)) return;
    try {
      await markPaidOut(merchantId);
      setMsg(`Payout for ${name} marked as complete.`);
      setTimeout(() => setMsg(''), 3000);
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Action failed.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await getPhysicalVoucherPDF(1);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fidyah-physical-vouchers.pdf';
      a.click();
    } catch (err) {
      alert('No physical vouchers found or generation failed.');
    }
  };

  const totalOwed = ledger.reduce((s, r) => s + parseFloat(r.amount_owed || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Ledger & Payouts</h1>
        <button className="btn btn-outline" onClick={handleDownloadPDF}>📄 Download Physical Vouchers PDF</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="stat-card" style={{ marginBottom: 24, display: 'inline-block', minWidth: 220 }}>
        <div className="stat-label">Total Amount Owed to Merchants</div>
        <div className="stat-value">${totalOwed.toFixed(2)}</div>
      </div>

      <div className="card">
        <h3>Merchant Payout Summary</h3>
        <table>
          <thead><tr><th>Merchant</th><th>Bank Account</th><th>Redemptions</th><th>Total Redeemed</th><th>Amount Owed</th><th>Action</th></tr></thead>
          <tbody>
            {ledger.map(r => (
              <tr key={r.merchant_id}>
                <td>{r.business_name}</td>
                <td>{r.bank_account || <span style={{ color: '#aaa' }}>Not set</span>}</td>
                <td>{r.redemptions}</td>
                <td>${parseFloat(r.total_redeemed || 0).toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: parseFloat(r.amount_owed) > 0 ? '#016a6e' : '#aaa' }}>
                  ${parseFloat(r.amount_owed || 0).toFixed(2)}
                </td>
                <td>
                  {parseFloat(r.amount_owed) > 0
                    ? <button className="btn btn-success btn-sm" onClick={() => handlePayout(r.merchant_id, r.business_name)}>Mark Paid</button>
                    : <span className="badge badge-gray">Settled</span>
                  }
                </td>
              </tr>
            ))}
            {ledger.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#aaa',padding:32}}>No redemptions recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
