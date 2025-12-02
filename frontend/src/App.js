// src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Pages
import LandingPage from './pages/LandingPage'; // Renamed RoleSelect.js
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import KickedOut from './pages/KickedOut';

// Import Global Styles (must be imported once)
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Set the LandingPage (RoleSelect) as the root route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Existing routes */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        
        {/* New route for students who are kicked out */}
        <Route path="/kicked" element={<KickedOut />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;