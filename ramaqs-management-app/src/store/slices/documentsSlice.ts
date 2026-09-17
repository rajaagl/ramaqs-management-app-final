// src/store/slices/documentsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

interface DocumentsState {
  selectedDocument: any | null;
  filters: {
    projetId: string | null;
    type: string | null;
  };
  previewOpen: boolean;
}

const initialState: DocumentsState = {
  selectedDocument: null,
  filters: {
    projetId: null,
    type: null,
  },
  previewOpen: false,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setSelectedDocument: (state, action: PayloadAction<any | null>) => {
      state.selectedDocument = action.payload;
    },
    setDocumentFilterProjet: (state, action: PayloadAction<string | null>) => {
      state.filters.projetId = action.payload;
    },
    setDocumentFilterType: (state, action: PayloadAction<string | null>) => {
      state.filters.type = action.payload;
    },
    setPreviewOpen: (state, action: PayloadAction<boolean>) => {
      state.previewOpen = action.payload;
    },
    clearDocumentFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setSelectedDocument,
  setDocumentFilterProjet,
  setDocumentFilterType,
  setPreviewOpen,
  clearDocumentFilters,
} = documentsSlice.actions;

export default documentsSlice.reducer;