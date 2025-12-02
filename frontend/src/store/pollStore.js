import { create } from 'zustand';

export const usePollStore = create((set) => ({
  // Teacher State
  roomId: null,
  setRoomId: (roomId) => set({ roomId }),

  // Student State
  studentId: null,
  studentName: '',
  setStudentId: (id) => set({ studentId: id }),
  setStudentName: (name) => set({ studentName: name }),

  // Poll State
  currentPoll: null,
  pollResults: null,
  pollStatus: 'waiting', // waiting, active, closed
  timerRemaining: 0,
  hasAnswered: false,

  setPoll: (poll) =>
    set({
      currentPoll: poll,
      hasAnswered: false,
      timerRemaining: poll.timeLimit,
      pollStatus: 'active'
    }),

  updateResults: (results) => set({ pollResults: results }),
  setTimerRemaining: (time) => set({ timerRemaining: time }),
  setHasAnswered: (answered) => set({ hasAnswered: answered }),
  setPollStatus: (status) => set({ pollStatus: status }),

  // Room/Students State
  connectedStudents: [],
  setConnectedStudents: (students) => set({ connectedStudents: students }),
  
  addStudent: (student) =>
    set((state) => ({
      connectedStudents: [...state.connectedStudents, student]
    })),

  // Reset
  reset: () =>
    set({
      roomId: null,
      currentPoll: null,
      pollResults: null,
      pollStatus: 'waiting',
      timerRemaining: 0,
      hasAnswered: false,
      connectedStudents: []
    })
}));
