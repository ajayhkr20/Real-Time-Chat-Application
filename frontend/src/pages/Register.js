import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import './Auth.css';

export default function Register() {
  const nav = useNavigate();
  const [f, setF]   = useState({ username:'', email:'', password:'', password2:'' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setErr({}); setBusy(true);
    if (f.password !== f.password2) {
      setErr({ password2: "Passwords don't match" }); setBusy(false); return;
    }
    try {
      await register(f);
      nav('/login', { state: { registered: true } });
    } catch(ex) {
      setErr(ex.response?.data || { detail: 'Registration failed' });
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-blobs" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">💬</div>
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-sub">Private messaging, just for you</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label className="lbl">Username</label>
            <input className={`inp ${err.username ? 'err':''}`}
              placeholder="yourname" value={f.username} onChange={set('username')} required />
            {err.username && <span className="errmsg">{err.username}</span>}
          </div>

          <div className="field">
            <label className="lbl">Email</label>
            <input className={`inp ${err.email ? 'err':''}`} type="email"
              placeholder="you@example.com" value={f.email} onChange={set('email')} required />
            {err.email && <span className="errmsg">{err.email}</span>}
          </div>

          <div className="row2">
            <div className="field">
              <label className="lbl">Password</label>
              <input className={`inp ${err.password ? 'err':''}`} type="password"
                placeholder="••••••••" value={f.password} onChange={set('password')} required />
              {err.password && <span className="errmsg">{err.password}</span>}
            </div>
            <div className="field">
              <label className="lbl">Confirm</label>
              <input className={`inp ${err.password2 ? 'err':''}`} type="password"
                placeholder="••••••••" value={f.password2} onChange={set('password2')} required />
              {err.password2 && <span className="errmsg">{err.password2}</span>}
            </div>
          </div>

          {err.detail && <p className="errmsg">{err.detail}</p>}

          <button className="btn btn-primary auth-btn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account →'}
          </button>
        </form>

        <p className="auth-footer">
          Have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
