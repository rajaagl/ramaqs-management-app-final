// src/store/slices/budgetsSlice.ts
import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface BudgetsState {
  selectedBudget: any | null;
  alerts: {
    depassement: boolean;
    seuilAtteint: boolean;
  };
}

const initialState: BudgetsState = {
  selectedBudget: null,
  alerts: {
    depassement: false,
    seuilAtteint: false,
  },
};

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setSelectedBudget: (state, action: PayloadAction<any | null>) => {
      state.selectedBudget = action.payload;
      if (action.payload) {
        state.alerts.depassement = action.payload.depense > action.payload.total;
        state.alerts.seuilAtteint = action.payload.depense / action.payload.total >= 0.8;
      }
    },
    clearBudgetAlerts: (state) => {
      state.alerts = initialState.alerts;
    },
  },
});

export const { setSelectedBudget, clearBudgetAlerts } = budgetsSlice.actions;
export default budgetsSlice.reducer;