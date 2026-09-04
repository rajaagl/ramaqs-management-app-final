// src/store/slices/sousTachesSlice.ts
import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface SousTachesState {
  selectedSubTask: any | null;
  filters: {
    statut: string;
    tacheId: string | null;
  };
}

const initialState: SousTachesState = {
  selectedSubTask: null,
  filters: {
    statut: 'tous',
    tacheId: null,
  },
};

const sousTachesSlice = createSlice({
  name: 'sousTaches',
  initialState,
  reducers: {
    setSelectedSubTask: (state, action: PayloadAction<any | null>) => {
      state.selectedSubTask = action.payload;
    },
    setSubTaskFilterStatut: (state, action: PayloadAction<string>) => {
      state.filters.statut = action.payload;
    },
    setSubTaskFilterTache: (state, action: PayloadAction<string | null>) => {
      state.filters.tacheId = action.payload;
    },
    clearSubTaskFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedSubTask,
  setSubTaskFilterStatut,
  setSubTaskFilterTache,
  clearSubTaskFilters,
} = sousTachesSlice.actions;

export default sousTachesSlice.reducer;