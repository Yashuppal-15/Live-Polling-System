# 🎯 Intervue Live Polling System

A real-time polling application built with React and Node.js/Socket.io. Teachers can create live polls, and students can submit answers in real-time with instant results visualization.

---

## 📋 Features

### ✅ Core Features (Must-Have)
- **Teacher Dashboard**: Create polls with custom questions and options
- **Student Dashboard**: Join rooms with a room code and submit answers
- **Live Results**: Real-time poll results displayed to both teacher and students
- **Auto-Close Polls**: Polls close automatically when all students answer or when the timer expires (max 60s)
- **Configurable Time Limits**: Teachers can set custom time limits (10s - 300s)

### ✅ Good-to-Have Features
- **Remove Students**: Teachers can kick out students from the room
- **Well-Designed UI**: Clean, modern interface matching Figma design specifications
- **Poll History**: Teachers can view past poll results

### ✅ Bonus Features
- **Chat Popup**: Real-time messaging between teachers and students
- **Persistent State**: Poll history stored on backend (not local storage only)
- **Session Persistence**: Students remain connected even after tab/browser refresh

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, Socket.io-client |
| **Backend** | Node.js, Express, Socket.io |
| **Real-time Communication** | WebSocket via Socket.io |
| **Styling** | Custom CSS with modern design system |
| **State Management** | React Hooks |

---

## 📁 Project Structure

```
polling-system/
├── backend/
│   ├── controllers/
│   │   └── roomController.js
│   ├── models/
│   │   └── Room.js
│   ├── routes/
│   │   └── roomRoutes.js
│   ├── utils/
│   │   └── socketHandlers.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.js
│   │   │   └── StudentDashboard.js
│   │   ├── components/
│   │   │   └── ChatPopup.jsx
│   │   ├── styles/
│   │   │   ├── teacher.css
│   │   │   ├── student.css
│   │   │   └── index.css
│   │   ├── utils/
│   │   │   └── socket.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/Yashuppal-15/live-polling-system.git
cd live-polling-system
```

#### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (optional for local development):
```env
PORT=5000
NODE_ENV=development
```

Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Setup Frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (optional for local development):
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

Start the React app:
```bash
npm start
```

Frontend will open on `http://localhost:3000`

---

## 📖 How to Use the Application

### **Step 1: Open Teacher Dashboard**
1. Open `http://localhost:3000/teacher` in your browser
2. You'll see the **Teacher Dashboard** with:
   - Room code displayed at the top
   - 📋 Copy Code button to copy the room code
   - Create New Poll form

### **Step 2: Copy Room Code**
1. Click the **"📋 Copy Code"** button
2. The room code is now copied to your clipboard (e.g., `abc123xyz`)

### **Step 3: Open Student Tab**
1. Open a new browser tab
2. Navigate to `http://localhost:3000/student`
3. You'll see the **Student Entry Screen**

### **Step 4: Student Joins Room**
1. Enter your **name** (e.g., "Rahul Bajaj")
2. Paste the **room code** you copied from the teacher tab
3. Click **"Continue"** button
4. Student is now joined! You'll see "Waiting for Question" state

**Note:** You can open multiple student tabs to simulate multiple students. Each tab creates a unique student session.

### **Step 5: Teacher Creates a Poll**
1. Return to Teacher Dashboard
2. You should now see **1 participant** in the Participants section
3. Fill in the poll form:
   - **Question**: e.g., "What is 2 + 2?"
   - **Options**: Enter 2-4 answer options (e.g., "3", "4", "5", "6")
   - **Time Limit**: Select duration (default 60s)
4. Click **"🚀 Ask Question"**
5. Poll is now **live** and visible to all students

### **Step 6: Students Submit Answers**
1. In each student tab, you'll see:
   - ⏱️ Timer counting down
   - The question
   - Answer options as clickable buttons
2. Click any option to submit your answer
3. Once answered, you'll see **"✅ Answered"** status on teacher dashboard

### **Step 7: View Live Results**
After submitting:
1. **Student tabs** show live poll results with percentages and bar charts
2. **Teacher dashboard** updates in real-time showing:
   - Number of students who answered vs total
   - Live results bar chart
   - Percentage breakdown

### **Step 8: Poll Auto-Closes**
The poll closes automatically when:
- ✅ **All students have answered**, OR
- ⏱️ **Timer reaches 0 seconds**

Results are displayed for 3 seconds, then both teacher and students return to "Waiting for Question" state.

### **Step 9: Create Next Poll**
1. Teacher can immediately create another poll
2. Repeat steps 5-8

### **Step 10: View Poll History**
1. Click **"📜 View Poll History"** button in Participants section
2. See all past polls with results, response counts, and timing

### **Bonus: Remove a Student**
1. In Teacher Dashboard, find student in Participants list
2. Click **"Kick out"** button
3. That student's tab will navigate to "Kicked" screen and they cannot rejoin or answer

### **Bonus: Chat with Students**
1. Both teacher and students can see a **Chat Popup** (bottom right)
2. Click to expand and send real-time messages
3. Messages are shared with all participants in the room

---

## 🧪 Testing Scenarios

### Scenario 1: Single Student, Multiple Polls
- Open 1 student tab
- Teacher creates poll → Student answers → Results shown → Poll closes
- Teacher creates second poll → repeat
- **Expected**: Participant count stays at 1, no duplicates

### Scenario 2: Multiple Students, All Answer
- Open 2-3 student tabs (different names)
- Teacher creates poll
- All students submit answers within the time limit
- **Expected**: Poll auto-closes early (before timer), results show 100% answered

### Scenario 3: Multiple Students, Timer Expires
- Open 2-3 student tabs
- Teacher creates poll
- Only some students answer; wait for timer to hit 0
- **Expected**: Poll closes automatically, results show partial responses

### Scenario 4: Kick Student
- Open 2 student tabs
- Teacher kicks out one student
- Try answering in the kicked student's tab
- **Expected**: Kicked student sees "You were removed from the room" message and cannot answer

### Scenario 5: Refresh Browser
- Teacher creates a poll; 2 students join and answer
- Refresh **teacher tab**
  - **Expected**: Room loads, students list restored, past polls visible
- Refresh **student tab**
  - **Expected**: Student remains in room with same ID, participant count unchanged

---

## 🔌 Socket.io Events

### Server → Client (Emissions)

| Event | Payload | Description |
|-------|---------|-------------|
| `poll_created` | `{ question, options, timeLimit, pollId }` | New poll broadcast to students |
| `timer_update` | `{ remainingTime }` | Updates countdown timer |
| `results_update` | `{ results, options, totalAnswered, question }` | Live result updates |
| `poll_closed` | `{ results, options, totalAnswered, question }` | Poll ended; results finalized |
| `students_updated` | `{ students: [...] }` | Student list changed |
| `student_joined` | `{ studentName, totalStudents }` | New student joined |
| `student_answered` | `{ studentName, studentId }` | Student submitted answer |
| `kicked_out` | `{ reason }` | Student was removed |
| `message_received` | `{ author, text, role }` | Chat message |

### Client → Server (Listeners)

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{}` | Teacher creates new room |
| `join_room` | `{ roomId, studentId, studentName }` | Student joins room |
| `create_poll` | `{ roomId, question, options, timeLimit }` | Teacher creates poll |
| `submit_answer` | `{ roomId, pollId, selectedOption, studentId }` | Student submits answer |
| `remove_student` | `{ roomId, studentId }` | Teacher kicks student |
| `send_message` | `{ roomId, author, text, role }` | Chat message sent |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Frontend not connecting to backend
1. Check `REACT_APP_BACKEND_URL` in `frontend/.env`
2. Verify backend is running on the correct port
3. Check browser console for Socket.io connection errors

### Students duplicated in participant list
- Clear browser localStorage/sessionStorage
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Use **"Log Out / Reset"** button to clear session

### Poll timer not updating
- Check Socket.io connection in browser DevTools
- Verify backend emit is working: check server logs

---

## 📝 Git Workflow

```bash
# Initialize repo (if not already done)
git init
git remote add origin https://github.com/Yashuppal-15/live-polling-system.git

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push to GitHub
git push origin main
```

---

## 📋 Assignment Requirements Checklist

### Must-Have ✅
- [x] Functional system with all core features working
- [x] Frontend: React | Backend: Express.js + Socket.io
- [x] Teacher creates polls; students answer them
- [x] Both see poll results in real-time
- [x] UI follows Figma design specifications
- [x] Hosted on production (Vercel + Render/Railway)

### Good-to-Have ✅
- [x] Configurable poll time limit by teacher
- [x] Option for teacher to remove students
- [x] Well-designed user interface

### Bonus ✅
- [x] Chat popup for student-teacher interaction
- [x] Teacher can view past poll results (backend storage)

---

## 🤝 Contributing

For improvements or bug fixes:

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make changes and commit
git commit -m "feat: describe your changes"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 📄 License

This project is part of the Intervue.io SDE Intern Assignment Round 1.

---

## 🎉 Good Luck!


