const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});


app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// In-memory storage
const rooms = new Map();
const polls = new Map();
const pollTimers = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // ========================================
  // Teacher creates a room
  // ========================================
  socket.on('create_room', (data, callback) => {
    try {
      const roomId = uuidv4();
      const room = {
        roomId,
        teacherId: socket.id,
        students: [],
        currentPoll: null,
        pastPolls: [],
        createdAt: Date.now()
      };

      rooms.set(roomId, room);
      socket.join(roomId);

      console.log('🎓 Room created:', roomId);
      callback({ success: true, roomId });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Student joins room (with duplicate prevention)
  // ========================================
  socket.on('join_room', (data, callback) => {
    try {
      const { roomId, studentId, studentName } = data;
      console.log(`👥 join_room request - StudentId: ${studentId}, Socket: ${socket.id}`);

      const room = rooms.get(roomId);

      if (!room) {
        console.log('  ❌ Room not found');
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // CRITICAL: Check if this STUDENT ALREADY EXISTS (by studentId, not socket)
      const existingStudent = room.students.find(s => s.id === studentId);

      if (existingStudent) {
      // Student exists - just update socket and return
        console.log(`  ✅ Student exists. Old socket: ${existingStudent.socketId}, New socket: ${socket.id}`);
      
        // Update socket mapping
        existingStudent.socketId = socket.id;
      
        // Leave old socket room if different
        socket.leave(roomId);
        socket.join(roomId);

        console.log(`  ℹ️ Re-joined with new socket. Total students: ${room.students.length}`);
      
        callback({ 
          success: true, 
          students: room.students,
          message: 'Re-joined successfully'
        });

        // Emit updated list to room
        io.to(roomId).emit('students_updated', { 
          students: room.students 
        });
      
        return; // IMPORTANT: Exit here, don't add new student
      }

      // NEW student - add to room
      const student = {
        id: studentId,
        name: studentName,
        socketId: socket.id,
        status: 'pending',
        answered: false,
        answeredAt: null,
        joinedAt: Date.now()
      };

      room.students.push(student);
      socket.join(roomId);

      console.log(`  ✅ NEW student added. Total: ${room.students.length}`);

      callback({ 
        success: true, 
        students: room.students,
        message: 'Joined successfully'
      });

      // Notify all clients
      io.to(roomId).emit('students_updated', { students: room.students });
      io.to(roomId).emit('student_joined', {
        studentId: student.id,
        studentName: student.name,
        totalStudents: room.students.length
      });

    } catch (error) {
        console.error('Error in join_room:', error);
        callback({ success: false, error: error.message });
      } 
  });


  // ========================================
  // Teacher: Create Poll
  // ========================================
  socket.on('create_poll', (data, callback) => {
    try {
      const { roomId, question, options, timeLimit } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.teacherId !== socket.id) {
        callback({ success: false, error: 'Only teacher can create polls' });
        return;
      }

      // Only create if no active poll / all students answered
      if (room.currentPoll) {
        const activePoll = polls.get(room.currentPoll);

        if (activePoll && activePoll.status === 'active') {
          const allAnswered =
            room.students.length > 0 &&
            room.students.every((s) => s.answered);

          if (!allAnswered) {
            console.log('❌ Cannot create poll: Not all students answered');
            callback({
              success: false,
              error: 'Not all students have answered the current question'
            });
            return;
          }
        }
      }

      const pollId = uuidv4();
      const poll = {
        pollId,
        question,
        options,
        timeLimit: timeLimit || 60,
        createdAt: Date.now(),
        results: options.map(() => 0),
        status: 'active',
        answeredBy: []
      };

      polls.set(pollId, poll);
      room.currentPoll = pollId;

      // Reset all students' answered status
      room.students.forEach((s) => {
        s.answered = false;
      });

      console.log('📊 Poll created:', pollId, 'Question:', question);

      io.to(roomId).emit('poll_created', {
        pollId,
        question,
        options,
        timeLimit
      });

      startPollTimer(roomId, pollId, timeLimit);

      callback({ success: true, pollId, poll });
    } catch (error) {
      console.error('Error creating poll:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Student submits answer
  // ========================================
  socket.on('submit_answer', (data, callback) => {
    try {
      const { roomId, pollId, selectedOption, studentId } = data;
      const room = rooms.get(roomId);
      const poll = polls.get(pollId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (!poll) {
        callback({ success: false, error: 'Poll not found' });
        return;
      }

      if (poll.status !== 'active') {
        callback({ success: false, error: 'Poll is not active' });
        return;
      }

      // Find student by persistent ID
      const student = room.students.find((s) => s.id === studentId);

      if (!student) {
        console.log('❌ Student not found. StudentId:', studentId);
        console.log('   Available students:', room.students.map(s => s.id));
        callback({ success: false, error: 'Student not found' });
        return;
      }

      if (student.answered) {
        callback({ success: false, error: 'You have already answered' });
        return;
      }

      if (selectedOption < 0 || selectedOption >= poll.options.length) {
        callback({ success: false, error: 'Invalid option selected' });
        return;
      }

      // Record answer
      poll.results[selectedOption]++;
      poll.answeredBy.push(studentId);
      student.answered = true;
      student.answeredAt = Date.now();

      console.log('✔️ Answer submitted by:', student.name);

      socket.emit('answer_submitted', {
        success: true,
        message: 'Your answer has been recorded'
      });

      // Broadcast updated results
      io.to(roomId).emit('results_update', {
        pollId,
        results: poll.results,
        totalAnswered: poll.answeredBy.length,
        question: poll.question,
        options: poll.options
      });

      // Notify that a student answered
      io.to(roomId).emit('student_answered', {
        studentId: student.id,
        studentName: student.name
      });

      // Check if all students have answered
      const allAnswered =
        room.students.length > 0 && room.students.every((s) => s.answered);

      if (allAnswered && poll.status === 'active') {
        console.log('✅ All students answered! Closing poll.');
        closePoll(roomId, pollId);
      }

      callback({ success: true });
    } catch (error) {
      console.error('Error submitting answer:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Teacher removes a student
  // ========================================
  socket.on('remove_student', (data, callback) => {
    try {
      const { roomId, studentId } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.teacherId !== socket.id) {
        callback({ success: false, error: 'Only teacher can remove students' });
        return;
      }

      const studentIndex = room.students.findIndex(
        (s) => s.id === studentId
      );
      if (studentIndex === -1) {
        callback({ success: false, error: 'Student not found' });
        return;
      }

      const removedStudent = room.students[studentIndex];
      room.students.splice(studentIndex, 1);

      console.log('🚫 Student removed:', removedStudent.name);

      // Notify room that student was removed
      io.to(roomId).emit('students_updated', { students: room.students });

      // Tell the student they were kicked
      io.to(removedStudent.socketId).emit('kicked_out', {
        reason: 'Teacher removed you from the poll system'
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Get past poll results
  // ========================================
  socket.on('get_past_polls', (data, callback) => {
    try {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const pastPolls = room.pastPolls.map((pollId) => {
        const poll = polls.get(pollId);
        return {
          pollId,
          question: poll.question,
          options: poll.options,
          results: poll.results,
          totalAnswered: poll.answeredBy.length,
          createdAt: poll.createdAt
        };
      });

      console.log(`📜 Returning ${pastPolls.length} past polls for room:`, roomId);
      callback({ success: true, pastPolls });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Get current room state (for teacher dashboard refresh)
  // ========================================
  socket.on('get_room_state', (data, callback) => {
    try {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const currentPoll = room.currentPoll ? polls.get(room.currentPoll) : null;

      callback({
        success: true,
        room: {
          roomId: room.roomId,
          students: room.students.map((s) => ({
            id: s.id,
            name: s.name,
            answered: s.answered
          })),
          currentPoll: currentPoll
            ? {
                pollId: currentPoll.pollId,
                question: currentPoll.question,
                options: currentPoll.options,
                timeLimit: currentPoll.timeLimit
              }
            : null
        }
      });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Send message (chat)
  // ========================================
  socket.on('send_message', (data, callback) => {
    try {
      const { roomId, studentId, author, text, role } = data;
      const room = rooms.get(roomId);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      console.log(`💬 Message from ${author}:`, text);

      io.to(roomId).emit('message_received', {
        author,
        text,
        role,
        timestamp: Date.now()
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // ========================================
  // Disconnect handler
  // ========================================
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);

    // If teacher disconnects, close the room
    for (let [roomId, room] of rooms) {
      if (room.teacherId === socket.id) {
        console.log('🔒 Room closed due to teacher disconnect:', roomId);
        rooms.delete(roomId);
      }
    }
  });
});

// ========================================
// Helper: Start poll timer
// ========================================
function startPollTimer(roomId, pollId, timeLimit) {
  let remainingTime = timeLimit;

  const interval = setInterval(() => {
    remainingTime--;

    io.to(roomId).emit('timer_update', {
      pollId,
      remainingTime
    });

    if (remainingTime <= 0) {
      console.log('⏱️ Timer reached 0, closing poll:', pollId);
      clearInterval(interval);
      closePoll(roomId, pollId);
    }
  }, 1000);

  pollTimers.set(pollId, interval);
}

// ========================================
// Helper: Close poll
// ========================================
function closePoll(roomId, pollId) {
  console.log('🔒 closePoll() called for pollId:', pollId);

  const poll = polls.get(pollId);
  const room = rooms.get(roomId);

  console.log('  Poll exists?', !!poll);
  console.log('  Room exists?', !!room);

  if (!poll || !room) {
    console.log('  ❌ Poll or room not found, skipping closePoll');
    return;
  }

  clearInterval(pollTimers.get(pollId));
  pollTimers.delete(pollId);

  poll.status = 'closed';
  room.pastPolls = room.pastPolls || [];
  room.pastPolls.push(pollId);
  room.currentPoll = null;

  console.log('  ✅ Emitting poll_closed to room:', roomId);
  io.to(roomId).emit('poll_closed', {
    pollId,
    question: poll.question,
    results: poll.results,
    totalAnswered: poll.answeredBy.length,
    options: poll.options
  });

  console.log('🔒 Poll closed successfully:', pollId);
}

// ========================================
// Start server
// ========================================

// server.listen(5000, () => {
//   console.log('✅ Backend server running on http://localhost:5000');
// });

const PORT = process.env.PORT || 5000;

// Local development: only listen when run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
module.exports = server;

