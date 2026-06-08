import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();
  const [f, setF]     = useState({ email:'', password:'' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const me = await login(f.email, f.password);
      nav(me.bio ? '/chat' : '/profile?setup=1');
    } catch {
      setErr('Incorrect email or password');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-blobs" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">💬</div>
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-sub">Sign in to continue</p>
        </div>

        {loc.state?.registered && (
          <div className="auth-notice">✓ Account created — sign in below</div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label className="lbl">Email</label>
            <input className="inp" type="email" placeholder="you@example.com"
              value={f.email} onChange={set('email')} required autoFocus />
          </div>

          <div className="field">
            <label className="lbl">Password</label>
            <input className={`inp ${err ? 'err':''}`} type="password"
              placeholder="••••••••" value={f.password} onChange={set('password')} required />
          </div>

          {err && <p className="errmsg">{err}</p>}

          <button className="btn btn-primary auth-btn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
