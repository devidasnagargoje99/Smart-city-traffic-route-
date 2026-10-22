import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { SignalManagementPage } from './pages/SignalManagementPage';
import { EmergencyRoutingPage } from './pages/EmergencyRoutingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('commuter');
  const [simulatedClock, setSimulatedClock] = useState<string>('09:15');
  const [scenarioName, setScenarioName] = useState<string>('Morning IT Rush');

  // Poll or fetch active simulation state
  useEffect(() => {
    const fetchSimState = async () => {
      try {
        const state = await api.getCurrentSimulation();
        if (state) {
          setSimulatedClock(state.simulated_clock);
          setScenarioName(state.active_scenario?.name || 'Simulation');
        }
      } catch (err) {
        // Fallback for offline dev
      }
    };
    fetchSimState();
    const interval = setInterval(fetchSimState, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          simulatedClock={simulatedClock}
          scenarioName={scenarioName}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentRole={currentRole} />

          <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/60">
            <Routes>
              <Route path="/" element={<DashboardPage currentRole={currentRole} />} />
              <Route path="/map" element={<LiveMapPage currentRole={currentRole} />} />
              <Route path="/routes" element={<RoutePlannerPage currentRole={currentRole} />} />
              <Route path="/emergency" element={<EmergencyRoutingPage currentRole={currentRole} />} />
              <Route path="/incidents" element={<IncidentManagementPage currentRole={currentRole} />} />
              <Route path="/signals" element={<SignalManagementPage currentRole={currentRole} />} />
              <Route path="/analytics" element={<AnalyticsPage currentRole={currentRole} />} />
              <Route path="/settings" element={<SettingsPage currentRole={currentRole} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
