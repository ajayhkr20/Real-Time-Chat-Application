import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login    from './pages/Login';
import Profile  from './pages/Profile';
import Chat     from './pages/Chat';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spin" style={{ width:36, height:36 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route path="/login"    element={<Public><Login /></Public>} />
          <Route path="/profile"  element={<Private><Profile /></Private>} />
          <Route path="/chat"     element={<Private><Chat /></Private>} />
          <Route path="/chat/:id" element={<Private><Chat /></Private>} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
