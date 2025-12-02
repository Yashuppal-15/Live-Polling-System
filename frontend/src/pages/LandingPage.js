import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleTeacher = () => {
    navigate('/teacher');
  };

  const handleStudent = () => {
    navigate('/student');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>🎓 Live Polling System</h1>
        <p>Interactive Classroom Engagement Tool</p>

        <div className="role-selection">
          <button
            className="role-btn teacher-btn"
            onClick={handleTeacher}
          >
            <span className="role-icon">👨‍🏫</span>
            <span>Teacher</span>
          </button>

          <button
            className="role-btn student-btn"
            onClick={handleStudent}
          >
            <span className="role-icon">👨‍🎓</span>
            <span>Student</span>
          </button>
        </div>

        <footer className="landing-footer">
          <p>Intervue.io Assignment - SDE Intern</p>
        </footer>
      </div>
    </div>
  );
}
