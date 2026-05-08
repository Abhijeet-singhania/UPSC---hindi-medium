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
import PastYearProblems from './pages/PastYearProblems/PastYearProblems';
import AskAI from './pages/AskAI/AskAI';

import ProtectedRoute from './components/layout/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
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
              <Route path="/past-year" element={<PastYearProblems />} />
              <Route path="/ask-ai" element={<AskAI />} />
              <Route path="/community" element={<Community />} />
              <Route path="/wellbeing" element={<Wellbeing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
