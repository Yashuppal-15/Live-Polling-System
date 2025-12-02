import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="welcome-card">
        <div className="logo">
          <span className="logo-icon">🎓</span>
          <h1>Live Polling System</h1>
        </div>

        <p className="subtitle">
          Please select the role that describes you the best during using the live polling system
        </p>

        <div className="role-buttons">
          <button
            onClick={() => navigate('/student')}
            className="role-btn student-btn"
          >
            👨‍🎓 I'm a Student
            <span className="role-desc">Answer questions and see live results</span>
          </button>

          <button
            onClick={() => navigate('/teacher')}
            className="role-btn teacher-btn"
          >
            👨‍🏫 I'm a Teacher
            <span className="role-desc">Create polls and manage responses</span>
          </button>
        </div>
      </div>
    </div>
  );
}
