import { configureStore } from '@reduxjs/toolkit';
import { api } from './api/api';

import { useSelector, useDispatch  } from 'react-redux';
import type {TypedUseSelectorHook} from 'react-redux';
import {
  authReducer,
  projectsReducer,
  tachesReducer,
  sousTachesReducer,
  clientsReducer,
  consultantsReducer,
  partenairesReducer,
  sourcesReducer,
  documentsReducer,
  commentairesReducer,
  notificationsReducer,
  budgetsReducer,
  kpisReducer,
} from './slices';

import { logout } from './slices/authSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    projects: projectsReducer,
    taches: tachesReducer,
    sousTaches: sousTachesReducer,
    clients: clientsReducer,
    consultants: consultantsReducer,
    partenaires: partenairesReducer,
    sources: sourcesReducer,
    documents: documentsReducer,
    commentaires: commentairesReducer,
    notifications: notificationsReducer,
    budgets: budgetsReducer,
    kpis: kpisReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      api.middleware,
      // ✅ Vide automatiquement le cache RTK Query à chaque logout
      () => (next) => (action: any) => {
        const result = next(action);
        if (logout.match(action)) {
          store.dispatch(api.util.resetApiState());
        }
        return result;
      }
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
