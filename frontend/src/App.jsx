import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DashboardShell from './components/DashboardShell';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import RecipientDashboard from './pages/dashboards/RecipientDashboard';
import AnalystDashboard from './pages/dashboards/AnalystDashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="donor" element={<DonorDashboard />} />
          <Route path="recipient" element={<RecipientDashboard />} />
          <Route path="analyst" element={<AnalystDashboard />} />
          <Route index element={<Navigate to="/" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
