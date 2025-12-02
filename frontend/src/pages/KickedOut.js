// src/pages/KickedOut.js

import React from 'react';
// CORRECTED PATH: App.css is one level up from pages/, not inside styles/
import '../App.css'; 

export default function KickedOut() {
  return (
    <div className="kicked-out-page">
      <div className="kicked-out-card">
        <span className="intervue-badge">Intervue Poll</span>
        <h1>You've been kicked out!</h1>
        <p>
          Looks like the teacher had removed you from the poll system. Please try again sometime.
        </p>
      </div>
    </div>
  );
}