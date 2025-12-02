import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/kicked.css';

export default function KickedOut() {
  const navigate = useNavigate();

  return (
    <div className="kicked-page">
      <div className="kicked-badge">Intervue Poll</div>
      <h1>You’ve been Kicked out !</h1>
      <p>
        Looks like the teacher has removed you from the poll system. Please
        try again sometime.
      </p>
      <button className="btn-primary" onClick={() => navigate('/')}>
        Go to Home
      </button>
    </div>
  );
}
