import React, { useEffect, useState } from 'react';
import { getUsers, issueVoucher } from '../api/api';

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState('');
  const [form, setForm]         = useState({ user_id: '', amount: '', campaign_id: '1', is_physical: false });

  useEffect(() => { getUsers().then(r => setUsers(r.data.users)).catch(console.error); }, []);

  const notify = (text, type) => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000); };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await issueVoucher({ ...form, user_id: parseInt(form.user_id), amount: parseFloat(form.amount), campaign_id: parseInt(form.campaign_id) });
      notify(`✅ Voucher #${res.data.voucher_id} issued successfully!`, 'success');
      setForm(f => ({ ...f, user_id: '', amount: '' }));
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to issue voucher.', 'error');
    }
  };

  return (
    <div>
      <h1 className="page-title">Beneficiaries</h1>
      {msg && <div className={`alert alert-${msgType}`}>{msg}</div>}

      <div className="card">
        <h3>Issue Voucher to Beneficiary</h3>
        <form onSubmit={handleIssue} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Beneficiary</label>
            <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Amount ($)</label>
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 50" required />
          </div>
          <div className="form-group" style={{ margin: 0, display:'flex', alignItems:'flex-end', gap:8 }}>
            <label style={{marginBottom:0}}>
              <input type="checkbox" checked={form.is_physical} onChange={e => setForm(f => ({ ...f, is_physical: e.target.checked }))} style={{width:'auto', marginRight:6}} />
              Physical Voucher
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Issue Voucher</button>
        </form>
      </div>

      <div className="card">
        <h3>All Registered Beneficiaries ({users.length})</h3>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>NRIC</th><th>Phone</th><th>Status</th><th>Registered</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.nric || '—'}</td>
                <td>{u.phone || '—'}</td>
                <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#aaa',padding:32}}>No beneficiaries registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
