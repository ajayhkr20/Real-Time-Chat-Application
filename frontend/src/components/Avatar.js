import React from 'react';

export default function Avatar({ user, size = 38 }) {
  const initials = (user?.username || '?').slice(0,2).toUpperCase();
  return (
    <div className="av" style={{ width: size, height: size, fontSize: Math.round(size * .37) }}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user?.username} />
        : initials}
    </div>
  );
}
