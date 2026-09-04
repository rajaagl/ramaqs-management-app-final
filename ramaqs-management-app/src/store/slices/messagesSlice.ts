// src/store/slices/messagesSlice.ts
import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface MessagesState {
  unsentMessages: any[];
  typingUsers: string[];
}

const initialState: MessagesState = {
  unsentMessages: [],
  typingUsers: [],
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addUnsentMessage: (state, action: PayloadAction<any>) => {
      state.unsentMessages.push(action.payload);
    },
    removeUnsentMessage: (state, action: PayloadAction<string>) => {
      state.unsentMessages = state.unsentMessages.filter((m: any) => m.id !== action.payload);
    },
    clearUnsentMessages: (state) => {
      state.unsentMessages = [];
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },
  },
});

export const {
  addUnsentMessage,
  removeUnsentMessage,
  clearUnsentMessages,
  addTypingUser,
  removeTypingUser,
} = messagesSlice.actions;

export default messagesSlice.reducer;