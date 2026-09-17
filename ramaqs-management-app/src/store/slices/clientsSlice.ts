// src/store/slices/clientsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface ClientsState {
  selectedClient: any | null;
  filters: {
    search: string;
    secteurActivite: string | null;
  };
}

const initialState: ClientsState = {
  selectedClient: null,
  filters: {
    search: '',
    secteurActivite: null,
  },
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setSelectedClient: (state, action: PayloadAction<any | null>) => {
      state.selectedClient = action.payload;
    },
    setClientSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setClientSecteur: (state, action: PayloadAction<string | null>) => {
      state.filters.secteurActivite = action.payload;
    },
    clearClientFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedClient,
  setClientSearch,
  setClientSecteur,
  clearClientFilters,
} = clientsSlice.actions;

export default clientsSlice.reducer;