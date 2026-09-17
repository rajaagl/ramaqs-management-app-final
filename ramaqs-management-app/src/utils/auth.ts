// utils/auth.ts
// ============================================
// GESTION DE L'AUTHENTIFICATION
// ============================================

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

// ✅ AJOUTER CES FONCTIONS
export const getUserFromStorage = (): any | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUserInStorage = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUserFromStorage = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const isTokenExpired = (): boolean => {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};



// ========== TOKENS ==========

// Récupérer le token d'accès
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Sauvegarder le token d'accès
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Récupérer le refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Sauvegarder le refresh token
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

// Supprimer tous les tokens (déconnexion)
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// ========== JWT DECODING ==========

// Décoder le token JWT pour récupérer les infos (optionnel)
export const decodeToken = (): any | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // JWT est composé de 3 parties: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

// Récupérer l'ID de l'utilisateur depuis le token
export const getUserIdFromToken = (): string | null => {
  const decoded = decodeToken();
  return decoded?.user_id || decoded?.id || null;
};

// Récupérer le nom de l'utilisateur depuis le token
export const getUserNameFromToken = (): string | null => {
  const decoded = decodeToken();
  return decoded?.nom || decoded?.username || null;
};

// Récupérer le rôle depuis le token
export const getUserRoleFromToken = (): string | null => {
  const decoded = decodeToken();
  return decoded?.role || decoded?.user_role || null;
};

// ========== DÉCONNEXION COMPLÈTE ==========

// Déconnexion complète (supprime tout)
export const logout = (): void => {
  removeToken();
  removeUserFromStorage();
};
