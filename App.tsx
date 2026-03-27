/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LogsPage from './pages/LogsPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/logs" element={<LogsPage />} />
        
        {/* Placeholder Routes */}
        <Route path="/actions" element={<PlaceholderPage title="AI Actions" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/risk" element={<PlaceholderPage title="Risk Engine" />} />
        <Route path="/policy" element={<PlaceholderPage title="Policy Guardrails" />} />
        <Route path="/email" element={<PlaceholderPage title="Email Orchestration" />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
