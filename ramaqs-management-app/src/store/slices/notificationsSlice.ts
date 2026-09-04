// src/store/slices/notificationsSlice.ts
import { createSlice,type  PayloadAction } from '@reduxjs/toolkit';

interface NotificationsState {
  items: any[];
  nonLuesCount: number;
  filters: {
    type: string | null;
  };
}

const initialState: NotificationsState = {
  items: [],
  nonLuesCount: 0,
  filters: {
    type: null,
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
      state.nonLuesCount = action.payload.filter((n: any) => !n.lu).length;
    },
    addNotification: (state, action: PayloadAction<any>) => {
      state.items.unshift(action.payload);
      if (!action.payload.lu) {
        state.nonLuesCount++;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.items.find((n: any) => n.id === action.payload);
      if (notif && !notif.lu) {
        notif.lu = true;
        state.nonLuesCount--;
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n: any) => { n.lu = true; });
      state.nonLuesCount = 0;
    },
    setNotificationFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.type = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setNotificationFilter,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;