// src/store/slices/projectsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface ProjetsState {
  selectedProject: any | null;
  filters: {
    statut: string;
    search: string;
    clientId: string | null;
    dateDebutApres?: string;
    dateFinAvant?: string;
  };
  viewMode: 'tableau' | 'kanban' | 'calendrier';
}

const initialState: ProjetsState = {
  selectedProject: null,
  filters: {
    statut: 'tous',
    search: '',
    clientId: null,
  },
  viewMode: 'tableau',
};

const projetsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<any | null>) => {
      state.selectedProject = action.payload;
    },
    setFilterStatut: (state, action: PayloadAction<string>) => {
      state.filters.statut = action.payload;
    },
    setFilterSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setFilterClient: (state, action: PayloadAction<string | null>) => {
      state.filters.clientId = action.payload;
    },
    setFilterDate: (state, action: PayloadAction<{ debut?: string; fin?: string }>) => {
      if (action.payload.debut !== undefined) state.filters.dateDebutApres = action.payload.debut;
      if (action.payload.fin !== undefined) state.filters.dateFinAvant = action.payload.fin;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setViewMode: (state, action: PayloadAction<'tableau' | 'kanban' | 'calendrier'>) => {
      state.viewMode = action.payload;
    },
  },
});

export const {
  setSelectedProject,
  setFilterStatut,
  setFilterSearch,
  setFilterClient,
  setFilterDate,
  clearFilters,
  setViewMode,
} = projetsSlice.actions;

export default projetsSlice.reducer;