// src/store/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  nom: string;
  email: string;
  role: 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';
  telephone?: string;
  poste?: string;
  entreprise?: string;
  photo_profil?: string;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}
const USER_KEY = 'auth_user';

const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};
const initialState: AuthState = {
  user: getUserFromStorage(),
  tenantId: localStorage.getItem('current_tenant'),
  isAuthenticated: !!localStorage.getItem('access_token')&& !!getUserFromStorage(),
  isLoading: false,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ✅ Set credentials après login ou register
    setCredentials: (state, action: PayloadAction<{ 
      user: User;
      tenantId: string;
      accessToken: string;
      refreshToken: string;
    }>) => {
      const { user, tenantId, accessToken, refreshToken } = action.payload;
      
      state.user = user;
      state.tenantId = tenantId;
      state.isAuthenticated = true;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('current_tenant', tenantId);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    },
    
    // ✅ Mise à jour uniquement de l'access token (après refresh)
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
    },
    
    // ✅ Déconnexion
    logout: (state) => {
      state.user = null;
      state.tenantId = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('current_tenant');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    
    // ✅ Mise à jour des informations utilisateur
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      }
    },
    
    // ✅ Changer de tenant
    setTenant: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
      localStorage.setItem('current_tenant', action.payload);
    },
    
    // ✅ Gestion du chargement
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

// ✅ Export des actions
export const { 
  setCredentials, 
  updateAccessToken,
  logout, 
  updateUser, 
  setTenant, 
  setLoading 
} = authSlice.actions;

// ✅ Fonction utilitaire pour supprimer les tokens (optionnelle)
export const removeTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_tenant');
};

export default authSlice.reducer;