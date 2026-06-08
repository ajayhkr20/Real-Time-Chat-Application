import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';
import './Profile.css';

export default function Profile() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get('setup') === '1';
  const { user, refreshUser, logout } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [bio,      setBio]      = useState(user?.bio      || '');
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(user?.avatar_url || null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');
  const fileRef = useRef();

  const pickFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('bio', bio);
      if (avatar) fd.append('avatar', avatar);
      await updateProfile(fd);
      await refreshUser();
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      if (isSetup) nav('/chat');
    } catch(ex) {
      const d = ex.response?.data;
      setErr(d?.username?.[0] || d?.bio?.[0] || 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  const initials = (user?.username || '?').slice(0,2).toUpperCase();

  return (
    <div className="pf-page">
      <div className="pf-blob" />
      <div className="pf-card">
        {/* Nav */}
        <div className="pf-nav">
          {!isSetup && (
            <button className="btn btn-ghost pf-back" onClick={() => nav('/chat')}>
              ← Chat
            </button>
          )}
          <span style={{ flex:1 }} />
          <button className="btn btn-ghost pf-logout"
            onClick={() => { logout(); nav('/login'); }}>
            Sign out
          </button>
        </div>

        <h2 className="pf-title">{isSetup ? 'Set up your profile' : 'Edit profile'}</h2>
        {isSetup && (
          <p className="pf-hint">Add a photo and a short bio so people know who you are.</p>
        )}

        {/* Avatar picker */}
        <div className="pf-av-wrap">
          <div className="pf-av" onClick={() => fileRef.current.click()}>
            {preview
              ? <img src={preview} alt="avatar" />
              : <span className="pf-initials">{initials}</span>}
            <div className="pf-av-hover">📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} hidden />
          <button className="btn btn-ghost pf-pick"
            onClick={() => fileRef.current.click()}>
            {preview ? 'Change photo' : 'Upload photo'}
          </button>
        </div>

        <form onSubmit={save} className="pf-form">
          <div className="field">
            <label className="lbl">Username</label>
            <input className="inp" value={username} required
              onChange={e => setUsername(e.target.value)} placeholder="yourname" />
          </div>

          <div className="field">
            <label className="lbl">Email</label>
            <input className="inp" value={user?.email || ''} disabled
              style={{ opacity:.4, cursor:'not-allowed' }} />
          </div>

          <div className="field">
            <label className="lbl">Bio</label>
            <textarea className="inp pf-bio" rows={3} value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people a little about yourself…" />
          </div>

          {err && <p className="errmsg">{err}</p>}

          <button className="btn btn-primary pf-save" type="submit" disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : isSetup ? 'Continue to chat →' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
