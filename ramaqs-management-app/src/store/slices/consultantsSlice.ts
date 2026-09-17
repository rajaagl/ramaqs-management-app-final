// src/store/slices/consultantsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface ConsultantsState {
  selectedConsultant: any | null;
  filters: {
    search: string;
    competence: string | null;
    disponibleSeulement: boolean;
  };
}

const initialState: ConsultantsState = {
  selectedConsultant: null,
  filters: {
    search: '',
    competence: null,
    disponibleSeulement: false,
  },
};

const consultantsSlice = createSlice({
  name: 'consultants',
  initialState,
  reducers: {
    setSelectedConsultant: (state, action: PayloadAction<any | null>) => {
      state.selectedConsultant = action.payload;
    },
    setConsultantSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setConsultantCompetence: (state, action: PayloadAction<string | null>) => {
      state.filters.competence = action.payload;
    },
    toggleDisponibleSeulement: (state) => {
      state.filters.disponibleSeulement = !state.filters.disponibleSeulement;
    },
    clearConsultantFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedConsultant,
  setConsultantSearch,
  setConsultantCompetence,
  toggleDisponibleSeulement,
  clearConsultantFilters,
} = consultantsSlice.actions;

export default consultantsSlice.reducer;