// src/store/slices/conversationsSlice.ts
import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface ConversationsState {
  activeConversationId: string | null;
  unreadCount: number;
  filters: {
    projetId: string | null;
  };
}

const initialState: ConversationsState = {
  activeConversationId: null,
  unreadCount: 0,
  filters: {
    projetId: null,
  },
};

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount++;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
    setConversationFilterProjet: (state, action: PayloadAction<string | null>) => {
      state.filters.projetId = action.payload;
    },
  },
});

export const {
  setActiveConversation,
  setUnreadCount,
  incrementUnread,
  resetUnread,
  setConversationFilterProjet,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;