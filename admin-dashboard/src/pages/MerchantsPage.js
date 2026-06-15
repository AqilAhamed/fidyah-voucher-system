import React, { useEffect, useState } from 'react';
import { getMerchants, approveMerchant } from '../api/api';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [msg, setMsg]             = useState('');

  const load = () => getMerchants().then(r => setMerchants(r.data.merchants)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleApprove = async (id, approved) => {
    try {
      await approveMerchant(id, approved);
      setMsg(`Merchant ${approved ? 'approved' : 'suspended'}.`);
      setTimeout(() => setMsg(''), 3000);
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Action failed.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Merchant Management</h1>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h3>Registered Merchants ({merchants.length})</h3>
        <table>
          <thead><tr><th>ID</th><th>Business Name</th><th>Email</th><th>UEN</th><th>Bank Account</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {merchants.map(m => (
              <tr key={m.id}>
                <td>#{m.id}</td>
                <td>{m.business_name}</td>
                <td>{m.email}</td>
                <td>{m.uen || '—'}</td>
                <td>{m.bank_account || '—'}</td>
                <td><span className={`badge ${m.is_approved ? 'badge-green' : 'badge-yellow'}`}>{m.is_approved ? 'Approved' : 'Pending'}</span></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {!m.is_approved
                    ? <button className="btn btn-success btn-sm" onClick={() => handleApprove(m.id, true)}>Approve</button>
                    : <button className="btn btn-danger btn-sm" onClick={() => handleApprove(m.id, false)}>Suspend</button>
                  }
                </td>
              </tr>
            ))}
            {merchants.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#aaa',padding:32}}>No merchants registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
