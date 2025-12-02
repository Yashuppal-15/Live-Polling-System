// src/pages/TeacherDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getSocket from '../utils/socket';
import ChatPopup from '../components/ChatPopup';
import '../styles/teacher.css';

const socket = getSocket;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [timeLimit, setTimeLimit] = useState(60);
  const [pollActive, setPollActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState(null);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pollHistory, setPollHistory] = useState([]);
  const [showPollHistory, setShowPollHistory] = useState(false);

  // ========================================
  // INIT: Load room on mount (ONLY ONCE)
  // ========================================
  useEffect(() => {
    console.log('🔧 TeacherDashboard mounted');

    const savedRoomCode = localStorage.getItem('teacherRoomCode');

    if (savedRoomCode) {
      console.log('📍 Using existing room:', savedRoomCode);
      setRoomCode(savedRoomCode);

      // Get current room state
      socket.emit('get_room_state', { roomId: savedRoomCode }, (res) => {
        if (res.success) {
          const { room } = res;
          console.log('📦 Room state loaded');
          console.log('   Students count:', room.students?.length);
          console.log('   Students:', room.students);

          setStudents(room.students || []);

          if (room.currentPoll) {
            setCurrentPoll(room.currentPoll);
            setPollActive(true);
          }
        } else {
          console.error('❌ Failed to get room state:', res.error);
        }
      });

      // Load past polls
      socket.emit('get_past_polls', { roomId: savedRoomCode }, (res) => {
        if (res.success) {
          console.log('📜 Past polls loaded:', res.pastPolls.length);
          const convertedPolls = res.pastPolls.map((poll) => ({
            question: poll.question,
            results: poll.results,
            options: poll.options,
            totalAnswered: poll.totalAnswered,
            closedAt: new Date(poll.createdAt).toLocaleTimeString()
          }));
          setPollHistory(convertedPolls);
        } else {
          console.error('❌ Failed to get past polls:', res.error);
        }
      });
    } else {
      console.log('🆕 Creating brand new room');
      createRoom();
    }
  }, []);

  // ========================================
  // Socket Listeners Setup
  // ========================================
  useEffect(() => {
    console.log('🔌 Setting up socket listeners...');

    const handleStudentsUpdated = (data) => {
      console.log('📊 Students list updated');
      console.log('   New count:', data.students?.length);

      const updatedStudents = data.students.map((s) => ({
        id: s.id,
        name: s.name,
        answered: s.answered || false
      }));

      setStudents(updatedStudents);
    };

    const handleStudentJoined = (data) => {
      console.log('👥 Student joined:', data.studentName);
      console.log('   Total students now:', data.totalStudents);
      // Do not mutate students here; use students_updated as source of truth
    };

    const handleStudentAnswered = (data) => {
      console.log('✅ Student answered:', data.studentName);

      setStudents((prev) =>
        prev.map((s) =>
          s.id === data.studentId ? { ...s, answered: true } : s
        )
      );
    };

    const handleResultsUpdate = (data) => {
      console.log('📊 Results updated');
      console.log('   Total answered:', data.totalAnswered);
      setResults(data);
    };

    const handlePollClosed = (data) => {
      console.log('🔒 Poll closed event received');
      setCurrentPoll(null);
      setPollActive(false);
      setResults(data);

      setPollHistory((prev) => {
        const updated = [
          ...prev,
          {
            question: data.question,
            results: data.results,
            options: data.options,
            totalAnswered: data.totalAnswered,
            closedAt: new Date().toLocaleTimeString()
          }
        ];
        console.log('✅ Poll added to history. Total:', updated.length);
        return updated;
      });

      setStudents((prev) => prev.map((s) => ({ ...s, answered: false })));
    };

    const handleStudentRemoved = (data) => {
      console.log('🚫 Student removed:', data.studentName);
      setStudents((prev) => prev.filter((s) => s.id !== data.studentId));
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

    socket.on('students_updated', handleStudentsUpdated);
    socket.on('student_joined', handleStudentJoined);
    socket.on('student_answered', handleStudentAnswered);
    socket.on('results_update', handleResultsUpdate);
    socket.on('poll_closed', handlePollClosed);
    socket.on('student_removed', handleStudentRemoved);
    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('students_updated', handleStudentsUpdated);
      socket.off('student_joined', handleStudentJoined);
      socket.off('student_answered', handleStudentAnswered);
      socket.off('results_update', handleResultsUpdate);
      socket.off('poll_closed', handlePollClosed);
      socket.off('student_removed', handleStudentRemoved);
      socket.off('message_received', handleMessageReceived);
    };
  }, []);

  // ========================================
  // Create Room
  // ========================================
  const createRoom = () => {
    socket.emit('create_room', {}, (response) => {
      if (response.success) {
        console.log('✅ Room created:', response.roomId);
        setRoomCode(response.roomId);
        localStorage.setItem('teacherRoomCode', response.roomId);
      } else {
        console.error('❌ Failed to create room:', response.error);
        alert('Error creating room: ' + response.error);
      }
    });
  };

  // ========================================
  // Check if can create poll
  // ========================================
  const canCreatePoll = () => {
    if (!currentPoll) {
      return true;
    }

    if (currentPoll && students.length > 0) {
      const allAnswered = students.every((s) => s.answered);
      if (allAnswered) return true;
    }

    return false;
  };

  // ========================================
  // Create Poll
  // ========================================
  const handleCreatePoll = () => {
    if (!canCreatePoll()) {
      alert(
        '❌ Cannot create poll yet!\n\nWait for all students to answer the current question.'
      );
      return;
    }

    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    if (timeLimit < 10 || timeLimit > 300) {
      alert('Time limit must be between 10 and 300 seconds');
      return;
    }

    console.log('📤 Creating poll in room:', roomCode);

    const pollData = {
      roomId: roomCode,
      question: question.trim(),
      options: validOptions,
      timeLimit: parseInt(timeLimit)
    };

    socket.emit('create_poll', pollData, (response) => {
      if (response.success) {
        console.log('✅ Poll created successfully');
        setCurrentPoll(response.poll);
        setPollActive(true);
        setQuestion('');
        setOptions(['', '', '', '']);
        setTimeLimit(60);
        setStudents((prev) => prev.map((s) => ({ ...s, answered: false })));
      } else {
        alert('Error: ' + response.error);
      }
    });
  };

  // ========================================
  // Handle option change
  // ========================================
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // ========================================
  // Copy room code
  // ========================================
  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      alert('✅ Room code copied: ' + roomCode);
    } else {
      alert('❌ Room code not available yet. Please wait...');
    }
  };

  // ========================================
  // Kick student
  // ========================================
  const handleKickStudent = (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to kick out ${studentName}?`)) {
      console.log('🚫 Kicking out student:', studentId);
      socket.emit(
        'remove_student',
        { roomId: roomCode, studentId },
        (response) => {
          if (response.success) {
            console.log('✅ Student kicked out');
            alert(`${studentName} has been removed from the room`);
          } else {
            console.error('❌ Error kicking out student:', response?.error);
            alert('Error removing student: ' + response?.error);
          }
        }
      );
    }
  };

  // ========================================
  // Send message
  // ========================================
  const handleSendMessage = (text) => {
    if (!text.trim() || !roomCode) return;

    console.log('📤 Sending message:', text);

    socket.emit(
      'send_message',
      {
        roomId: roomCode,
        author: 'Teacher',
        text: text.trim(),
        role: 'teacher'
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

  // ========================================
  // Reset / logout
  // ========================================
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // ========================================
  // Render
  // ========================================
  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1>👨‍🏫 Teacher Dashboard</h1>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
          >
            Reset Dashboard
          </button>
        </div>
        <div className="room-info">
          <p>
            Room Code: <strong>{roomCode || '⏳ Loading...'}</strong>
          </p>
          <button
            onClick={handleCopyRoomCode}
            className="btn btn-secondary btn-sm"
          >
            📋 Copy Code
          </button>
        </div>
      </div>

      <div className="teacher-container">
        {!showPollHistory ? (
          <>
            <div className="create-poll-section">
              <h2>📝 Create New Poll</h2>

              <div
                className={`poll-status ${
                  canCreatePoll() ? 'ready' : 'waiting'
                }`}
              >
                {canCreatePoll() ? (
                  <p>✅ Ready to create new poll</p>
                ) : (
                  <p>
                    ⏳ Waiting for all students to answer (
                    {students.filter((s) => s.answered).length}/
                    {students.length})...
                  </p>
                )}
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Enter your question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question"
                    className="input-field textarea"
                    disabled={!canCreatePoll()}
                  />
                </div>

                <div className="form-group">
                  <label>Edit Options</label>
                  {options.map((option, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(idx, e.target.value)
                      }
                      placeholder={`Option ${idx + 1}`}
                      className="input-field"
                      disabled={!canCreatePoll()}
                    />
                  ))}
                </div>

                <div className="form-group">
                  <label>
                    Time Limit (seconds)
                    <select
                      value={timeLimit}
                      onChange={(e) =>
                        setTimeLimit(parseInt(e.target.value))
                      }
                      className="input-field select-field"
                      disabled={!canCreatePoll()}
                    >
                      {[10, 15, 20, 30, 45, 60, 90, 120, 180, 300].map(
                        (time) => (
                          <option key={time} value={time}>
                            {time}s
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleCreatePoll}
                  disabled={!canCreatePoll()}
                  className={`btn ${
                    canCreatePoll() ? 'btn-primary' : 'btn-disabled'
                  }`}
                >
                  🚀 Ask Question
                </button>
              </form>
            </div>

            <div className="poll-info-section">
              {currentPoll ? (
                <div>
                  <h2>📊 Current Poll</h2>
                  <p className="poll-question">{currentPoll.question}</p>
                  <div className="poll-stats">
                    <span>⏱️ Time Limit: {currentPoll.timeLimit}s</span>
                    <span>👥 Students: {students.length}</span>
                    <span>
                      ✅ Answered:{' '}
                      {students.filter((s) => s.answered).length}/
                      {students.length}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h2>📋 No Poll Active</h2>
                  <p>Create a poll to get started!</p>
                </div>
              )}
            </div>

            {results && (
              <div className="results-section">
                <h2>📈 Poll Results</h2>
                <p className="results-question">{results.question}</p>
                <div className="results-display">
                  {results.results &&
                    results.results.map((count, idx) => {
                      const percentage =
                        results.totalAnswered > 0
                          ? (
                              (count / results.totalAnswered) *
                              100
                            ).toFixed(1)
                          : 0;
                      return (
                        <div key={idx} className="result-item">
                          <div className="result-header">
                            <span className="option-label">
                              {results.options &&
                                results.options[idx]}
                            </span>
                            <span className="result-stats">
                              {percentage}%
                            </span>
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

            <div className="participants-section">
              <div className="section-header">
                <h2>👥 Participants</h2>
                <button
                  className="link-button"
                  onClick={() => setShowPollHistory(true)}
                >
                  📜 View Poll History
                </button>
              </div>

              <div className="students-list">
                {students.length > 0 ? (
                  students.map((student) => (
                    <div key={student.id} className="student-card">
                      <div className="student-info">
                        <span className="student-name">
                          {student.name}
                        </span>
                        <span
                          className={`status ${
                            student.answered
                              ? 'answered'
                              : 'pending'
                          }`}
                        >
                          {student.answered
                            ? '✅ Answered'
                            : '⏳ Pending'}
                        </span>
                      </div>
                      <button
                        className="link-button danger"
                        onClick={() =>
                          handleKickStudent(student.id, student.name)
                        }
                      >
                        Kick out
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No students joined yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="poll-history-section">
            <div className="history-header">
              <h2>📜 View Poll History</h2>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPollHistory(false)}
              >
                ← Back
              </button>
            </div>

            {pollHistory.length > 0 ? (
              <div className="history-list">
                {pollHistory.map((poll, idx) => (
                  <div key={idx} className="history-item">
                    <h3>Question {idx + 1}</h3>
                    <p className="history-question">{poll.question}</p>
                    <div className="history-results">
                      {poll.results &&
                        poll.results.map((count, optIdx) => {
                          const percentage =
                            poll.totalAnswered > 0
                              ? (
                                  (count / poll.totalAnswered) *
                                  100
                                ).toFixed(1)
                              : 0;
                          return (
                            <div
                              key={optIdx}
                              className="history-result-item"
                            >
                              <div className="history-result-header">
                                <span>{poll.options[optIdx]}</span>
                                <span>{percentage}%</span>
                              </div>
                              <div className="history-result-bar">
                                <div
                                  className="history-result-fill"
                                  style={{
                                    width: `${percentage}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <p className="history-meta">
                      Total Responses: {poll.totalAnswered} | Closed
                      at: {poll.closedAt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No polls completed yet</p>
            )}
          </div>
        )}
      </div>

      <ChatPopup
        messages={messages}
        participants={students}
        onSend={handleSendMessage}
      />
    </div>
  );
}