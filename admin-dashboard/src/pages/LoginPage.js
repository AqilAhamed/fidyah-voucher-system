import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize your Supabase client
// Replace 'YOUR_PUBLIC_ANON_KEY' with your actual anon key from the Supabase dashboard
const supabase = createClient('https://zmnftukwspmiiqmuwfci.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptbmZ0dWt3c3BtaWlxbXV3ZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjE5OTUsImV4cCI6MjA5NzA5Nzk5NX0.9_iIVElrMT12mrw975DTcM9RZTPapCSYnTuZPIc-ZUM');

export default function LoginPage() {
  const [email, setEmail]       = useState('admin@muis.gov.sg');
  const [password, setPassword] = useState('admin123');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');

    try {
      // 2. Authenticate directly against your Supabase auth instance
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 3. Extract the metadata role parameters we set up earlier
      const userRole = data.user?.user_metadata?.role;
      
      if (userRole !== 'admin') {
        // Force log out unauthorized users instantly
        await supabase.auth.signOut();
        setError('Access denied. This portal is restricted to administrators.');
        return;
      }

      // 4. Save the secure session JWT token string for your Express server
      const sessionToken = data.session.access_token;
      localStorage.setItem('adminToken', sessionToken);
      
      // Navigate cleanly over to your operational workspace
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🇲🇺🇮🇸</div>
        <h1 className="login-title">MUIS Admin Portal</h1>
        <p className="login-sub">Fidyah Voucher Management System</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}