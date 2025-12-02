// src/pages/LandingPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// CORRECTED PATH: App.css is one level up from pages/, not inside styles/
import '../App.css'; 

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate('/student');
    } else if (selectedRole === 'teacher') {
      navigate('/teacher');
    } else {
      alert('Please select a role to continue.');
    }
  };

  return (
    <div className="role-select-page">
      <div className="role-select-card">
        <span className="intervue-badge">Intervue Poll</span>
        <h1>Welcome to the Live Polling System</h1>
        <p className="subtitle">
          Please select the role that best describes you to begin using the live polling system
        </p>

        <div className="role-options">
          <div
            className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <h2>I'm a Student</h2>
            <p>
              Submit answers and participate in live polls.
            </p>
          </div>
          <div
            className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <h2>I'm a Teacher</h2>
            <p>
              Create polls and view live poll results in real-time.
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-continue" 
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
}