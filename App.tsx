/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LogsPage from './pages/LogsPage';
import ActionsPage from './pages/ActionsPage';
import SettingsPage from './pages/SettingsPage';

function Protected({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={(
            <Protected>
              <DashboardPage />
            </Protected>
          )}
        />
        <Route
          path="/logs"
          element={(
            <Protected>
              <LogsPage />
            </Protected>
          )}
        />
        <Route
          path="/actions"
          element={(
            <Protected>
              <ActionsPage />
            </Protected>
          )}
        />
        <Route
          path="/settings"
          element={(
            <Protected>
              <SettingsPage />
            </Protected>
          )}
        />

        <Route
          path="/risk"
          element={(
            <Protected>
              <SettingsPage />
            </Protected>
          )}
        />
        <Route
          path="/policy"
          element={(
            <Protected>
              <SettingsPage />
            </Protected>
          )}
        />
        <Route
          path="/email"
          element={(
            <Protected>
              <SettingsPage />
            </Protected>
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
