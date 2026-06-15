import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout     from './components/Layout';
import LoginPage  from './pages/LoginPage';
import Dashboard  from './pages/Dashboard';
import UsersPage  from './pages/UsersPage';
import MerchantsPage from './pages/MerchantsPage';
import LedgerPage from './pages/LedgerPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="users"      element={<UsersPage />} />
          <Route path="merchants"  element={<MerchantsPage />} />
          <Route path="ledger"     element={<LedgerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
