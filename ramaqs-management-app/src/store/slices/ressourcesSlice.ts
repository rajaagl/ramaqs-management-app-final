// src/store/slices/ressourcesSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface RessourcesState {
  selectedRessource: any | null;
  filters: {
    search: string;
    competences: string[];
  };
}

const initialState: RessourcesState = {
  selectedRessource : null,
  filters: {
    search: '',
    competences: [],
  },
};

const ressourcesSlice = createSlice({
  name: 'ressources',
  initialState,
  reducers: {
    setSelectedRessource: (state, action: PayloadAction<any | null>) => {
      state.selectedRessource = action.payload;
    },
    setRessourceSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    addRessourceCompetence: (state, action: PayloadAction<string>) => {
      if (!state.filters.competences.includes(action.payload)) {
        state.filters.competences.push(action.payload);
      }
    },
    removeRessourceCompetence: (state, action: PayloadAction<string>) => {
      state.filters.competences = state.filters.competences.filter(c => c !== action.payload);
    },
    clearRessourceFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedRessource,
  setRessourceSearch,
  addRessourceCompetence,
  removeRessourceCompetence,
  clearRessourceFilters,
} = ressourcesSlice.actions;

export default ressourcesSlice.reducer;