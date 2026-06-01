import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppLayout from './components/layout/AppLayout';
import Welcome from './pages/Welcome/Welcome';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Roadmap from './pages/Roadmap/Roadmap';
import CurrentAffairs from './pages/CurrentAffairs/CurrentAffairs';
import AffairDetail from './pages/AffairDetail/AffairDetail';
import StudyContent from './pages/StudyContent/StudyContent';
import PrelimsLab from './pages/PrelimsLab/PrelimsLab';
import Community from './pages/Community/Community';
import Wellbeing from './pages/Wellbeing/Wellbeing';
import AskAI from './pages/AskAI/AskAI';
import Rewards from './pages/Rewards/Rewards';
import Settings from './pages/Settings/Settings';
import AnswerWriting from './pages/AnswerWriting/AnswerWriting';
import Admin from './pages/Admin/Admin';

import ProtectedRoute from './components/layout/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { fetchProfile } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(state => state.auth);

  // On every page load/refresh, re-fetch the full profile (including role)
  // if there is a valid token in state. This ensures role-gated UI works
  // correctly after a browser refresh, not just after a fresh login.
  useEffect(() => {
    if (isAuthenticated && token && token !== 'mock_jwt_token') {
      dispatch(fetchProfile());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              <Route path="/affairs/:id" element={<AffairDetail />} />
              <Route path="/prelims" element={<PrelimsLab />} />
              <Route path="/past-year" element={<Navigate to="/prelims" replace />} />
              <Route path="/ask-ai" element={<AskAI />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/community" element={<Community />} />
              <Route path="/wellbeing" element={<Wellbeing />} />
              <Route path="/answers" element={<AnswerWriting />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
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
