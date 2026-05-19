import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Welcome from './pages/Welcome/Welcome';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Roadmap from './pages/Roadmap/Roadmap';
import CurrentAffairs from './pages/CurrentAffairs/CurrentAffairs';
import StudyContent from './pages/StudyContent/StudyContent';
import PrelimsLab from './pages/PrelimsLab/PrelimsLab';
import Community from './pages/Community/Community';
import Wellbeing from './pages/Wellbeing/Wellbeing';
import AskAI from './pages/AskAI/AskAI';
import Rewards from './pages/Rewards/Rewards';
import Settings from './pages/Settings/Settings';
import AnswerWriting from './pages/AnswerWriting/AnswerWriting';

import ProtectedRoute from './components/layout/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';

function App() {
  return (
    <ThemeProvider>
      <UIProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/content" element={<StudyContent />} />
              <Route path="/affairs" element={<CurrentAffairs />} />
              <Route path="/prelims" element={<PrelimsLab />} />
              <Route path="/past-year" element={<Navigate to="/prelims" replace />} />
              <Route path="/ask-ai" element={<AskAI />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/community" element={<Community />} />
              <Route path="/wellbeing" element={<Wellbeing />} />
              <Route path="/answers" element={<AnswerWriting />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
