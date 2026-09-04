// src/store/slices/commentairesSlice.ts
import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface CommentairesState {
  selectedComment: any | null;
  editMode: boolean;
  replyTo: string | null;
}

const initialState: CommentairesState = {
  selectedComment: null,
  editMode: false,
  replyTo: null,
};

const commentairesSlice = createSlice({
  name: 'commentaires',
  initialState,
  reducers: {
    setSelectedComment: (state, action: PayloadAction<any | null>) => {
      state.selectedComment = action.payload;
    },
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.editMode = action.payload;
    },
    setReplyTo: (state, action: PayloadAction<string | null>) => {
      state.replyTo = action.payload;
    },
    clearCommentState: (state) => {
      state.selectedComment = null;
      state.editMode = false;
      state.replyTo = null;
    },
  },
});

export const { setSelectedComment, setEditMode, setReplyTo, clearCommentState } = commentairesSlice.actions;
export default commentairesSlice.reducer;