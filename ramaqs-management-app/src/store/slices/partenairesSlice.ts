// src/store/slices/partenairesSlice.ts
import { createSlice  } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface PartenairesState {
  selectedPartenaire: any | null;
  filters: {
    search: string;
    actif: boolean | null;
  };
}

const initialState: PartenairesState = {
  selectedPartenaire: null,
  filters: {
    search: '',
    actif: null,
  },
};

const partenairesSlice = createSlice({
  name: 'partenaires',
  initialState,
  reducers: {
    setSelectedPartenaire: (state, action: PayloadAction<any | null>) => {
      state.selectedPartenaire = action.payload;
    },
    setPartenaireSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setPartenaireActif: (state, action: PayloadAction<boolean | null>) => {
      state.filters.actif = action.payload;
    },
    clearPartenaireFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedPartenaire,
  setPartenaireSearch,
  setPartenaireActif,
  clearPartenaireFilters,
} = partenairesSlice.actions;

export default partenairesSlice.reducer;