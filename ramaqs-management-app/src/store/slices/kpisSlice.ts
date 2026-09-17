// src/store/slices/kpisSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface KPIsState {
  selectedPeriod: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee';
  selectedKPI: any | null;
  filters: {
    projetId: string | null;
  };
}

const initialState: KPIsState = {
  selectedPeriod: 'mois',
  selectedKPI: null,
  filters: {
    projetId: null,
  },
};

const kpisSlice = createSlice({
  name: 'kpis',
  initialState,
  reducers: {
    setSelectedPeriod: (state, action: PayloadAction<KPIsState['selectedPeriod']>) => {
      state.selectedPeriod = action.payload;
    },
    setSelectedKPI: (state, action: PayloadAction<any | null>) => {
      state.selectedKPI = action.payload;
    },
    setKPIFilterProjet: (state, action: PayloadAction<string | null>) => {
      state.filters.projetId = action.payload;
    },
  },
});

export const { setSelectedPeriod, setSelectedKPI, setKPIFilterProjet } = kpisSlice.actions;
export default kpisSlice.reducer;