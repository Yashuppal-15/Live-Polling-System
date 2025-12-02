import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getSocket from '../utils/socket';
import ChatPopup from '../components/ChatPopup';
import '../styles/student.css';

const socket = getSocket;
const RESULT_DISPLAY_TIME = 3000; // 3 seconds

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [currentPoll, setCurrentPoll] = useState(() => {
    const saved = localStorage.getItem('currentPoll');
    return saved ? JSON.parse(saved) : null;
  });
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('currentResults');
    return saved ? JSON.parse(saved) : null;
  });
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);

  // Restore UI state from sessionStorage, but DO NOT auto-join socket room
  useEffect(() => {
    const savedStudentId = sessionStorage.getItem('studentId');
    const savedRoomCode = sessionStorage.getItem('studentRoomCode');
    const savedName = sessionStorage.getItem('studentName');

    if (savedStudentId && savedRoomCode && savedName) {
      console.log('📍 Restoring student UI from sessionStorage');
      setStudentId(savedStudentId);
      setRoomCode(savedRoomCode);
      setName(savedName);
      setJoined(true);
      // IMPORTANT: do NOT emit join_room here to avoid duplicate students
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    console.log('🔧 Setting up socket listeners...');

    const handleConnect = () => {
      console.log('✅ Socket connected:', socket.id);
    };

    const handlePollCreated = (data) => {
      console.log('📋 Poll received:', data.question);
      setCurrentPoll(data);
      setHasAnswered(false);
      setResults(null);
      localStorage.setItem('currentPoll', JSON.stringify(data));
      localStorage.removeItem('currentResults');
    };

    const handleResultsUpdate = (data) => {
      console.log('📊 Results:', data);
      setResults(data);
      localStorage.setItem('currentResults', JSON.stringify(data));
    };

    const handleTimerUpdate = (data) => {
      console.log('⏱️ Timer:', data.remainingTime);
      setTimerRemaining(data.remainingTime);
    };

    const handlePollClosed = (data) => {
      console.log('🔒 Poll closed');
      setCurrentPoll(null);
      setResults(data);
      setHasAnswered(true);
      localStorage.setItem('currentResults', JSON.stringify(data));
      localStorage.removeItem('currentPoll');

      setTimeout(() => {
        console.log('⏳ Auto-transitioning to waiting state...');
        setResults(null);
        setHasAnswered(false);
      }, RESULT_DISPLAY_TIME);
    };

    const handleAnswerSubmitted = (data) => {
      if (data.success) {
        console.log('✅ Answer recorded');
        setHasAnswered(true);
      }
    };

    const handleKickedOut = (data) => {
      console.log('🚫 Kicked out:', data?.reason);
      sessionStorage.clear();
      localStorage.removeItem('currentPoll');
      localStorage.removeItem('currentResults');
      navigate('/kicked');
    };

    const handleStudentJoined = (data) => {
      console.log('👥 New student joined:', data.studentName);
      setParticipants((prev) => [
        ...prev,
        { id: data.studentId, name: data.studentName }
      ]);
    };

    const handleStudentsUpdated = (data) => {
      console.log('📊 Students updated, total:', data.students?.length);
      if (data.students) {
        setParticipants(
          data.students.map((s) => ({ id: s.id, name: s.name }))
        );
      }
    };

    const handleMessageReceived = (data) => {
      console.log('💬 Message received:', data.text);
      setMessages((prev) => [
        ...prev,
        {
          author: data.author,
          text: data.text,
          role: data.role === 'teacher' ? 'teacher' : 'student'
        }
      ]);
    };

    socket.on('connect', handleConnect);
    socket.on('poll_created', handlePollCreated);
    socket.on('results_update', handleResultsUpdate);
    socket.on('timer_update', handleTimerUpdate);
    socket.on('poll_closed', handlePollClosed);
    socket.on('answer_submitted', handleAnswerSubmitted);
    socket.on('kicked_out', handleKickedOut);
    socket.on('student_joined', handleStudentJoined);
    socket.on('students_updated', handleStudentsUpdated);
    socket.on('message_received', handleMessageReceived);

    // No cleanup since dashboard persists during session
  }, [navigate]);

  // Join room when student presses Continue
  const handleJoinRoom = () => {
    if (!name.trim() || !roomCode.trim()) {
      alert('Please enter name and room code');
      return;
    }

    // Ensure we have a persistent studentId
    let id = studentId;
    if (!id) {
      id = `student_${Math.random().toString(36).substr(2, 9)}`;
      setStudentId(id);
      sessionStorage.setItem('studentId', id);
    }

    console.log('🚀 Joining room:', roomCode, 'studentId:', id);

    socket.emit(
      'join_room',
      { roomId: roomCode, studentId: id, studentName: name },
      (response) => {
        if (response.success) {
          console.log('✅ Joined successfully!');
          setJoined(true);
          sessionStorage.setItem('studentId', id);
          sessionStorage.setItem('studentRoomCode', roomCode);
          sessionStorage.setItem('studentName', name);
        } else {
          console.error('❌ Join failed:', response.error);
          alert('Error joining room: ' + response.error);
        }
      }
    );
  };

  // Submit answer handler
  const handleAnswerSelection = (optionIndex) => {
    if (!joined || !currentPoll || !studentId) {
      alert('Not properly connected');
      return;
    }

    console.log('📤 Submitting answer:', optionIndex);
    console.log('   StudentId:', studentId);
    console.log('   PollId:', currentPoll.pollId);

    socket.emit(
      'submit_answer',
      {
        roomId: roomCode,
        pollId: currentPoll.pollId,
        selectedOption: optionIndex,
        studentId: studentId
      },
      (response) => {
        if (response.success) {
          console.log('✅ Answer submitted');
        } else {
          console.error('❌ Submit failed:', response.error);
          alert('Error: ' + response.error);
        }
      }
    );
  };

  // Send message handler
  const handleSendMessage = (text) => {
    if (!text.trim() || !joined) return;

    console.log('📤 Sending message:', text);

    socket.emit(
      'send_message',
      {
        roomId: roomCode,
        studentId: studentId,
        author: name,
        text: text.trim(),
        role: 'student'
      },
      (response) => {
        if (response.success) {
          console.log('✅ Message sent');
          setMessages((prev) => [
            ...prev,
            { author: 'You', text: text.trim(), role: 'self' }
          ]);
        } else {
          console.error('❌ Send failed:', response?.error);
        }
      }
    );
  };

  // Reset / logout handler
  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  };

  // Render: Entry screen
  if (!joined) {
    return (
      <div className="student-entry">
        <div className="entry-card">
          <div className="entry-badge">Intervue Poll</div>
          <h1>Let's Get Started</h1>
          <p>
            If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Enter your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Bajaj"
                className="input-field"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Enter Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Room code from teacher"
                className="input-field"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinRoom}
              className="btn btn-primary btn-full"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render: Dashboard
  return (
    <div className="student-dashboard">
      <div className="student-header">
        <h1>👨‍🎓 Welcome, {name}!</h1>
        <button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ marginLeft: '16px' }}
        >
          Log Out / Reset
        </button>
      </div>

      <div className="student-container">
        {!currentPoll && !results && (
          <div className="waiting-section">
            <div className="waiting-card">
              <h2>⏳ Waiting for Question</h2>
              <p>Waiting for your teacher to ask a question...</p>
              <div className="spinner"></div>
            </div>
          </div>
        )}

        {currentPoll && !hasAnswered && (
          <div className="question-section">
            <div className="timer-display">
              <span className="timer-label">⏱️ </span>
              <span className="timer-value">
                {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:
                {String(timerRemaining % 60).padStart(2, '0')}
              </span>
            </div>

            <h2 className="question">{currentPoll.question}</h2>

            <div className="options-grid">
              {currentPoll.options &&
                currentPoll.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelection(idx)}
                    className="option-btn"
                  >
                    <span className="option-icon">●</span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {(hasAnswered || results) && results && (
          <div className="results-section">
            <h2>📊 Results</h2>
            <p className="results-question">{results.question}</p>

            <div className="results-display">
              {results.results &&
                results.results.map((count, idx) => {
                  const percentage =
                    results.totalAnswered > 0
                      ? ((count / results.totalAnswered) * 100).toFixed(1)
                      : 0;

                  return (
                    <div key={idx} className="result-item">
                      <div className="result-header">
                        <div className="result-left">
                          <span className="result-icon">●</span>
                          <span className="option-label">
                            {results.options && results.options[idx]}
                          </span>
                        </div>
                        <span className="result-stats">{percentage}%</span>
                      </div>
                      <div className="result-bar">
                        <div
                          className="result-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <p className="total-responses">
              Total Responses: {results.totalAnswered}
            </p>
          </div>
        )}
      </div>

      <ChatPopup
        messages={messages}
        participants={participants}
        onSend={handleSendMessage}
      />
    </div>
  );
}
