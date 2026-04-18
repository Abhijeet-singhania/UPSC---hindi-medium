import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Roadmap from './pages/Roadmap/Roadmap';
import CurrentAffairs from './pages/CurrentAffairs/CurrentAffairs';
import StudyContent from './pages/StudyContent/StudyContent';
import PrelimsLab from './pages/PrelimsLab/PrelimsLab';
import Community from './pages/Community/Community';
import Wellbeing from './pages/Wellbeing/Wellbeing';
import PastYearProblems from './pages/PastYearProblems/PastYearProblems';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="content" element={<StudyContent />} />
          <Route path="affairs" element={<CurrentAffairs />} />
          <Route path="prelims" element={<PrelimsLab />} />
          <Route path="past-year" element={<PastYearProblems />} />
          <Route path="community" element={<Community />} />
          <Route path="wellbeing" element={<Wellbeing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
