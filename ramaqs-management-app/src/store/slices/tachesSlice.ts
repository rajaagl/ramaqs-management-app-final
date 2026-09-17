// src/store/slices/tachesSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface TachesState {
  selectedTask: any | null;
  filters: {
    statut: 'tous' | 'a_faire' | 'en_cours' | 'termine';
    priorite: 'tous' | 'faible' | 'normale' | 'haute' | 'critique';
    assigneA: string | null;
    projetId: string | null;
  };
}

const initialState: TachesState = {
  selectedTask: null,
  filters: {
    statut: 'tous',
    priorite: 'tous',
    assigneA: null,
    projetId: null,
  },
};

const tachesSlice = createSlice({
  name: 'taches',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<any | null>) => {
      state.selectedTask = action.payload;
    },
    setTaskFilterStatut: (state, action: PayloadAction<TachesState['filters']['statut']>) => {
      state.filters.statut = action.payload;
    },
    setTaskFilterPriorite: (state, action: PayloadAction<TachesState['filters']['priorite']>) => {
      state.filters.priorite = action.payload;
    },
    setTaskFilterAssignee: (state, action: PayloadAction<string | null>) => {
      state.filters.assigneA = action.payload;
    },
    setTaskFilterProjet: (state, action: PayloadAction<string | null>) => {
      state.filters.projetId = action.payload;
    },
    clearTaskFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedTask,
  setTaskFilterStatut,
  setTaskFilterPriorite,
  setTaskFilterAssignee,
  setTaskFilterProjet,
  clearTaskFilters,
} = tachesSlice.actions;

export default tachesSlice.reducer;