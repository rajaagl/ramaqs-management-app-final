// src/store/api/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { getToken } from '../../utils/auth';
import { API_BASE_URL } from '../../config/endpoints';
import { logout, updateAccessToken } from '../slices/authSlice';
import type {Projet, Tache, SousTache, Client, Partenaire, Document, Notification, Budget, KPI, Ressource, PaginatedResponse, Utilisateur, UsersListResponse, RegisterData, ApproveRejectData} from '../interfaces';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
   return headers;
   },
  });

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args, apiContext, extraOptions,
) => {
  let result = await rawBaseQuery(args, apiContext, extraOptions);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && !url.includes('/auth/refresh/')) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh/', method: 'POST', body: { refresh: refreshToken } },
        apiContext,
        extraOptions,
      );
      const access = (refreshResult.data as { access?: string } | undefined)?.access;
      if (access) {
        apiContext.dispatch(updateAccessToken(access));
        result = await rawBaseQuery(args, apiContext, extraOptions);
      } else {
        apiContext.dispatch(logout());
      }
    } else {
      apiContext.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Projet', 'Tache', 'SousTache', 'Client', 'Partenaire', 'Document', 'Notification', 'KPI', 'Ressource', 'User', 'Consultant', 'Budget'],
  endpoints: (builder) => ({

    // ========== PROJETS ==========
    getProjets: builder.query<PaginatedResponse<Projet>, { page?: number; pageSize?: number; search?: string; statut?: string }>({
      query: (params) => ({
        url: '/projets/',
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 10,
          search: params?.search,
          statut: params?.statut,
        },
      }),
      // ✅ AJOUTER transformResponse
        // ✅ Version corrigée (ajoute client_nom)
transformResponse: (response: any) => {
  // Cas tableau direct
  if (Array.isArray(response)) {
    return {
      count: response.length,
      results: response.map((projet: any) => ({
        id: projet.id,
        name: projet.name || projet.nom,
        nom: projet.nom,
        description: projet.description,
        statut: projet.statut,
        budget: projet.budget,
        avancement: projet.avancement_globale || projet.avancement,
        chefProjetId: projet.chefProjetId || projet.chef_projet_id || projet.chef_projet?.[0],
        chefProjetNom: projet.chef_projet_nom,
        clientId: projet.clientId || projet.client_id,
        clientNom: projet.client_nom,  // ← AJOUTE CETTE LIGNE
        code: projet.code,
        domaine: projet.domaine,
        dateDebut: projet.date_debut,
        dateFinPrevue: projet.date_fin_prevue,
        progress: Number(projet.avancement_globale) || 0,
        spent: Number(projet.budget_consomme) || 0,
        team: projet.team || [],
        Budget: projet.budget,  // ← Alias pour compatibilité
        nombre_membres: projet.nombre_membres || 0,
      })),
      next: null,
      previous: null,
    };
  }
  
  // Cas paginé
  if (response && response.results) {
    return {
      ...response,
      results: response.results.map((projet: any) => ({
        id: projet.id,
        name: projet.name || projet.nom,
        nom: projet.nom,
        description: projet.description,
        statut: projet.statut,
        budget: projet.budget,
        avancement: projet.avancement_globale || projet.avancement,
        chefProjetId: projet.chefProjetId || projet.chef_projet_id || projet.chef_projet?.[0],
        chefProjetNom: projet.chef_projet_nom,
        clientId: projet.clientId || projet.client_id,
        clientNom: projet.client_nom,  // ← AJOUTE CETTE LIGNE
        code: projet.code,
        domaine: projet.domaine,
        dateDebut: projet.date_debut,
        dateFinPrevue: projet.date_fin_prevue,
        progress: Number(projet.avancement_globale) || 0,
        spent: Number(projet.budget_consomme) || 0,
        Budget: projet.budget,  // ← Alias pour compatibilité
        nombre_membres: projet.nombre_membres || 0,
        team: projet.team || [],  // ou laisser vide
      })),
    };
  }
  
  return response;
},
   
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((item) => ({ type: 'Projet' as const, id: item.id })),
              { type: 'Projet', id: 'LIST' },
            ]
          : [{ type: 'Projet', id: 'LIST' }],
    }),

    getProjetById: builder.query<Projet, string>({
      query: (id) => `/projets/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Projet', id }],
    }),

    createProjet: builder.mutation<Projet, Partial<Projet>>({
      query: (newProjet) => ({
        url: '/projets/',
        method: 'POST',
        body: newProjet,
      }),
      invalidatesTags: [{ type: 'Projet', id: 'LIST' }],
    }),

    updateProjet: builder.mutation<Projet, { id: string; data: Partial<Projet> }>({
      query: (arg) => ({
        url: `/projets/${arg.id}/`,
        method: 'PUT',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Projet', id: arg.id },
        { type: 'Projet', id: 'LIST' },
      ],
    }),

    patchProjet: builder.mutation<Projet, { id: string; data: Partial<Projet> }>({
      query: (arg) => ({
        url: `/projets/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Projet', id: arg.id },
        { type: 'Projet', id: 'LIST' },
      ],
    }),

    deleteProjet: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Projet', id },
        { type: 'Projet', id: 'LIST' },
      ],
    }),

    getProjetMembres: builder.query<{
      projet_id: string;
      projet_nom: string;
      membres: {
        id: string;
        nom: string;
        email: string;
        telephone: string;
        role: 'direction' | 'chef_projet' | 'consultant' | 'client' | 'partenaire';
      }[];
    }, string>({
      query: (id) => `/projets/${id}/membres/`,
      providesTags: (_result, _error, id) => [{ type: 'Projet', id }],
    }),


// ========== TÂCHES ==========
getTaches: builder.query<PaginatedResponse<Tache>, {
  page?: number;
  pageSize?: number;
  projetId?: string;
  assigneA?: string;
  statut?: string;
  priorite?: string;
}>({
  query: (params) => ({
    url: '/taches/',
    params: {
      page: params?.page || 1,
      page_size: params?.pageSize || 100,
      projet: params?.projetId,
      consultant: params?.assigneA,
      statut: params?.statut,
      priorite: params?.priorite,
    },
  }),
  transformResponse: (response: any) => {
    // ✅ Fonction pour normaliser le statut
    const normalizeStatus = (statut: string): string => {
      if (statut === 'en_cours') return 'en_cours';
      if (statut === 'a_faire') return 'a_faire';
      if (statut === 'termine') return 'termine';
      if (statut === 'en_attente_validation') return 'en_attente_validation';
      if (statut === 'en cours') return 'en_cours';  // ← Support pour l'ancien format
      return 'a_faire';
    };

    // ✅ Fonction pour mapper une tâche
    const mapTask = (task: any): Tache => ({
      id: task.id,
      title: task.titre || task.title || "",
      description: task.description || "",
      priority: task.priorite || task.priority || "normale",
      status: normalizeStatus(task.statut) as any,
      avancement: Number(task.avancement) || 0,
      dateEcheance: task.date_fin_prevue || "",
      projetId: task.projet || task.projet_id || task.projetId || "",
      projectId: task.projet || task.projet_id || task.projectId || "",
      projetNom: task.projet_nom || "",  // ✅ Ajout du nom du projet directement
      dateCreation: task.date_creation || new Date().toISOString(),
      dateModification: task.date_modification || new Date().toISOString(),
      commentaires: task.commentaires || [],
      progress: Number(task.avancement) || 0,
      assignee: task.consultant_nom || task.assigneNom || "Non assigné",
      assigneA: task.consultant || task.consultant_id || task.assigneA || "",
      assigneNom: task.consultant_nom || task.assigneNom || "" ,
      dueDate: task.date_fin_prevue || "",
      
    });

    // ✅ Cas 1: Tableau direct
    if (Array.isArray(response)) {
      return {
        count: response.length,
        results: response.map(mapTask),
        next: null,
        previous: null,
      };
    }

    // ✅ Cas 2: Structure paginée
    if (response && response.results) {
      return {
        ...response,
        results: response.results.map(mapTask),
      };
    }

    return { count: 0, results: [], next: null, previous: null };
  },
  providesTags: (result) =>
    result?.results
      ? [
          ...result.results.map((item) => ({ type: 'Tache' as const, id: item.id })),
          { type: 'Tache', id: 'LIST' },
        ]
      : [{ type: 'Tache', id: 'LIST' }],
}),
getTacheById: builder.query<Tache, string>({
  query: (id) => `/taches/${id}/`,
  transformResponse: (task: any): Tache => ({
    id: task.id,
    title: task.title || task.titre || "",
    description: task.description || "",
    priority: task.priority || task.priorite || "normale",
    status: task.status === 'en cours' ? 'en_cours' : (task.status || task.statut || 'a_faire'),
    avancement: Number(task.avancement) || 0,
    dateEcheance: task.dateEcheance || task.date_fin_prevue || new Date().toISOString().split('T')[0],
    projetId: task.projet || task.projetId || task.projet_id || "",
    assigneA: task.consultant || "",
    assigneNom: task.consultant_nom || "",
    dateCreation: task.dateCreation || task.date_creation || new Date().toISOString(),
    dateModification: task.dateModification || task.date_modification || new Date().toISOString(),
    commentaires: task.commentaires || [],
    progress: Number(task.avancement) || 0,
    assignee: task.assigneNom || task.consultant_nom || "Non assigné",
    projectId: task.projet || task.projetId || task.projet_id || "",
    dueDate: task.dueDate || task.dateEcheance || task.date_fin_prevue || new Date().toISOString().split('T')[0],
  }),
  providesTags: (_result, _error, id) => [{ type: 'Tache', id }],
}),

// store/api/api.ts
createTache: builder.mutation<Tache, Partial<Tache>>({
  query: (newTache) => {
    console.log("🔵 [API] createTache appelé à:", new Date().toISOString());
    console.log("🔵 [API] ID unique:", Math.random().toString(36));
    return {
      url: '/taches/',
      method: 'POST',
      body: newTache,
    };
  },
  invalidatesTags: (_result, _error, arg) => [
    { type: 'Tache', id: 'LIST' },
    { type: 'Projet', id: arg?.projetId },
  ],
}),

updateTache: builder.mutation<Tache, { id: string; data: Partial<Tache> }>({
  query: (arg) => ({
    url: `/taches/${arg.id}/`,
    method: 'PUT',
    body: {
      titre: arg.data.title,
      description: arg.data.description,
      priorite: arg.data.priority,
      avancement: arg.data.avancement,
      date_debut: arg.data.dateDebut,
      date_fin_prevue: arg.data.dateEcheance,
      statut: arg.data.status,
      // ✅ CORRECTION
      projet: arg.data.projetId,
      consultant: arg.data.assigneA,
    },
  }),
  invalidatesTags: (_result, _error, arg) => [
    { type: 'Tache', id: arg.id },
    { type: 'Tache', id: 'LIST' },
    { type: 'Projet', id: arg.data.projetId },
  ],
}),


patchTache: builder.mutation<Tache, { id: string; data: Partial<Tache> }>({
  query: (arg) => {
    const body: Record<string, any> = {};
    Object.entries(arg.data).forEach(([key, value]) => {
      if (key === 'status') {
        body['statut'] = value;
      } else {
        body[key] = value;
      }
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log("📤 [patchTache] body envoyé:", body);
    }
    return {
      url: `/taches/${arg.id}/`,
      method: 'PATCH',
      body,
    };
  },
   invalidatesTags: (_result, _error, arg) => [
    { type: 'Tache', id: arg.id },
    { type: 'Tache', id: 'LIST' },
     'Tache',
  ],
}),
  
   
 
deleteTache: builder.mutation<void, string>({
  query: (id) => ({
    url: `/taches/${id}/`,
    method: 'DELETE',
  }),
  invalidatesTags: (_result, _error, id) => [
    { type: 'Tache', id },
    { type: 'Tache', id: 'LIST' },
  ],
}),

    // ========== SOUS-TÂCHES ==========
    getSousTaches: builder.query<PaginatedResponse<SousTache>, { projetId?: string; assigneA?: string; statut?: string; page?: number }>({
      query: (params) => ({
        url: '/sousTaches/',
        params,
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((item) => ({ type: 'SousTache' as const, id: item.id })),
              { type: 'SousTache', id: 'LIST' },
            ]
          : [{ type: 'SousTache', id: 'LIST' }],
    }),

    getSousTacheById: builder.query<SousTache, string>({
      query: (id) => `/sousTaches/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'SousTache', id }],
    }),

    createSousTache: builder.mutation<SousTache, Partial<SousTache>>({
      query: (newSousTache) => ({
        url: '/sousTaches/',
        method: 'POST',
        body: newSousTache,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'SousTache', id: 'LIST' },
        { type: 'Projet', id: arg?.projetId },
      ],
    }),

    updateSousTache: builder.mutation<SousTache, { id: string; data: Partial<SousTache> }>({
      query: (arg) => ({
        url: `/sous-taches/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'SousTache', id: arg.id },
        { type: 'Projet', id: _result?.projetId },
      ],
    }),

    deleteSousTache: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sous-taches/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'SousTache', id },
        { type: 'SousTache', id: 'LIST' },
      ],
    }),

    // ========== RESSOURCES ==========
    getRessources: builder.query<PaginatedResponse<Ressource>, { search?: string; role?: string; page?: number; pageSize?: number }>({
      query: (params) => ({
        url: '/ressources/',
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 10,
          search: params?.search,
          role: params?.role,
        },
      }),
      providesTags: (_result) =>
        _result?.results
          ? [
              ..._result.results.map((item) => ({ type: 'Ressource' as const, id: item.id })),
              { type: 'Ressource', id: 'LIST' },
            ]
          : [{ type: 'Ressource', id: 'LIST' }],
    }),

    getRessourceById: builder.query<Ressource, string>({
      query: (id) => `/ressources/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Ressource', id }],
    }),

    createRessource: builder.mutation<Ressource, Partial<Ressource>>({
      query: (newRessource) => ({
        url: '/ressources/',
        method: 'POST',
        body: newRessource,
      }),
      invalidatesTags: [{ type: 'Ressource', id: 'LIST' }],
    }),

    updateRessource: builder.mutation<Ressource, { id: string; data: Partial<Ressource> }>({
      query: (arg) => ({
        url: `/ressources/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Ressource', id: arg.id },
        { type: 'Ressource', id: 'LIST' },
      ],
    }),

    deleteRessource: builder.mutation<void, string>({
      query: (id) => ({
        url: `/ressources/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Ressource', id },
        { type: 'Ressource', id: 'LIST' },
      ],
    }),

    // ========== LIMITATIONS (Clients) ==========
    getClients: builder.query<PaginatedResponse<Client>, { search?: string; page?: number }>({
      query: (params) => ({
        url: '/clients/',
        params,
      }),

      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((item) => ({ type: 'Client' as const, id: item.id })),
              { type: 'Client', id: 'LIST' },
            ]
          : [{ type: 'Client', id: 'LIST' }],
    }),

    getClientById: builder.query<Client, string>({
      query: (id) => `/clients/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Client', id }],
    }),

    createClient: builder.mutation<Client, Partial<Client>>({
      query: (newClient) => ({
        url: '/clients/',
        method: 'POST',
        body: newClient,
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),

    updateClient: builder.mutation<Client, { id: string; data: Partial<Client> }>({
      query: (arg) => ({
        url: `/clients/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Client', id: arg.id },
        { type: 'Client', id: 'LIST' },
      ],
    }),

    deleteClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clients/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Client', id },
        { type: 'Client', id: 'LIST' },
      ],
    }),

    // ========== PARTENAIRES ==========
    getPartenaires: builder.query<PaginatedResponse<Partenaire>, { search?: string; actif?: boolean; page?: number }>({
      query: (params) => ({
        url: '/partenaires/',
        params,
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((item) => ({ type: 'Partenaire' as const, id: item.id })),
              { type: 'Partenaire', id: 'LIST' },
            ]
          : [{ type: 'Partenaire', id: 'LIST' }],
    }),

    getPartenaireById: builder.query<Partenaire, string>({
      query: (id) => `/partenaires/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Partenaire', id }],
    }),

    createPartenaire: builder.mutation<Partenaire, Partial<Partenaire>>({
      query: (newPartenaire) => ({
        url: '/partenaires/',
        method: 'POST',
        body: newPartenaire,
      }),
      invalidatesTags: [{ type: 'Partenaire', id: 'LIST' }],
    }),

    updatePartenaire: builder.mutation<Partenaire, { id: string; data: Partial<Partenaire> }>({
      query: (arg) => ({
        url: `/partenaires/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Partenaire', id: arg.id },
        { type: 'Partenaire', id: 'LIST' },
      ],
    }),

    deletePartenaire: builder.mutation<void, string>({
      query: (id) => ({
        url: `/partenaires/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Partenaire', id },
        { type: 'Partenaire', id: 'LIST' },
      ],
    }),

    // ========== DOCUMENTS ==========
   getDocuments: builder.query<{ results: Document[]; count: number }, { page: number; pageSize: number }>({
    query: ({ page, pageSize }) => ({
      url: '/documents/',
      params: { page, page_size: pageSize },
    }),
    transformResponse: (response: any) => {
      const raw = Array.isArray(response) ? response : response?.results ?? [];
      const results: Document[] = raw.map((d: any) => ({
      id: d.id,
      name: d.nom,
      description: d.description ?? "",
      type: d.type,
      chemin: d.chemin,
      size: d.taille_formatee ?? "—",
      version: d.version,
      projectId: d.projet,
      projectName: d.projet_nom,
      uploadById: d.uploaded_by,
      uploadBy: d.uploaded_by_nom ?? "—",
      uploadAt: d.date_upload,
      }));
     return { results, count: Array.isArray(response) ? response.length : response?.count ?? results.length };
    },
    providesTags: (result) =>
      result
       ? [...result.results.map((d) => ({ type: 'Document' as const, id: d.id })), { type: 'Document', id: 'LIST' }]
       : [{ type: 'Document', id: 'LIST' }],
   }),


    getDocumentById: builder.query<Document, string>({
      query: (id) => `/documents/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Document', id }],
    }),

     uploadDocument: builder.mutation<void, FormData>({
       query: (formData) => ({ url: '/documents/', method: 'POST', body: formData }),
       invalidatesTags: [{ type: 'Document', id: 'LIST' }],
     }),

     deleteDocument: builder.mutation<void, string>({
      query: (id) => ({ url: `/documents/${id}/`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Document', id: 'LIST' }],
     }),

    // ========== NOTIFICATIONS ==========
    // store/api/api.ts
getNotifications: builder.query({
  query: (params) => ({
    url: '/notifications/',
    params: {
      page: params?.page || 1,
      non_lues: params?.nonLuesSeulement || false,
    },
  }),
  transformResponse: (response: any) => {
    // ✅ Cas 1: Tableau direct
    if (Array.isArray(response)) {
      return {
        count: response.length,
        results: response.map((n: any) => ({
          id: n.id,
          type: n.type,
          titre: n.titre,
          message: n.message,
          lu: n.lue,
          dateEnvoi: n.date_envoi,
          destinataireId: n.utilisateur,
          utilisateur_nom: n.utilisateur_nom,
          lienAction: n.lien_action,
          entite_id: n.entite_id,
          entite_type: n.entite_type,
        })),
      };
    }
    
    // ✅ Cas 2: Structure paginée
    if (response && response.results) {
      return {
        ...response,
        results: response.results.map((n: any) => ({
          id: n.id,
          type: n.type,
          titre: n.titre,
          message: n.message,
          lu: n.lue,
          dateEnvoi: n.date_envoi,
          destinataireId: n.utilisateur,
          utilisateur_nom: n.utilisateur_nom,
          lienAction: n.lien_action,
          entite_id: n.entite_id,
          entite_type: n.entite_type,
        })),
      };
    }
    
    return { count: 0, results: [] };
  },
  providesTags: (result: { results?: Array<{ id: string }>; }) => {
    // ✅ Typage explicite pour 'item' et 'result'
    const items = result?.results || [];
    return items.length > 0
      ? [
          ...items.map((item: any) => ({ type: 'Notification' as const, id: item.id })),
          { type: 'Notification' as const, id: 'LIST' },
        ]
      : [{ type: 'Notification' as const, id: 'LIST' }];
  },
}),

    markNotificationAsRead: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/lire/`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, notificationId) => [
        { type: 'Notification', id: notificationId },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/lire-tout/',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    deleteNotification: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, notificationId) => [
        { type: 'Notification', id: notificationId },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    // ========== KPI ==========
    getKPIs: builder.query<PaginatedResponse<KPI>, { projetId?: string; page?: number }>({
      query: (params) => ({
        url: '/kpis/',
        params,
      }),
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((item) => ({ type: 'KPI' as const, id: item.id })),
              { type: 'KPI', id: 'LIST' },
            ]
          : [{ type: 'KPI', id: 'LIST' }],
    }),

    getKPIById: builder.query<KPI, string>({
      query: (id) => `/kpis/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'KPI', id }],
    }),

    createKPI: builder.mutation<KPI, Partial<KPI>>({
      query: (newKPI) => ({
        url: '/kpis/',
        method: 'POST',
        body: newKPI,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'KPI', id: 'LIST' },
        { type: 'Projet', id: arg?.projetId },
      ],
    }),

    updateKPI: builder.mutation<KPI, { id: string; data: Partial<KPI> }>({
      query: (arg) => ({
        url: `/kpis/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'KPI', id: arg.id },
        { type: 'KPI', id: 'LIST' },
      ],
    }),

    deleteKPI: builder.mutation<void, string>({
      query: (id) => ({
        url: `/kpis/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'KPI', id },
        { type: 'KPI', id: 'LIST' },
      ],
    }),

    // ========== AUTHENTIFICATION ==========
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation({
      query: (refreshToken: string | null) => ({
        url: '/auth/logout/',
        method: 'POST',
        body: refreshToken ? { refresh_token: refreshToken } : {},
      }),
    }),

    getCurrentUser: builder.query({
      query: () => '/auth/me/',
      providesTags: ['User'],
    }),

    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/utilisateurs/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // ========== MOT DE PASSE OUBLIÉ ==========
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password/',
        method: 'POST',
        body: data,
      }),
    }),

    validateResetToken: builder.mutation({
      query: (data) => ({
        url: '/auth/validate-reset-token/',
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password/',
        method: 'POST',
        body: data,
      }),
    }),

    // ========== CONSULTANTS PAR PROJET ==========
    getConsultantsByProjet: builder.query({
      query: (projetId) => `/projets/${projetId}/consultants/`,
      providesTags: ['Consultant'],
    }),

    // ========== BUDGETS ==========
    getBudgets: builder.query<PaginatedResponse<Budget>, { page?: number; pageSize?: number; projetId?: string }>({
      query: (params) => ({
        url: '/budgets/',
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 10,
          projet_id: params?.projetId,
        },
      }),
      providesTags: (_result) =>
        _result?.results
          ? [
              ..._result.results.map((item) => ({ type: 'Budget' as const, id: item.id })),
              { type: 'Budget', id: 'LIST' },
            ]
          : [{ type: 'Budget', id: 'LIST' }],
    }),

    getBudgetById: builder.query<Budget, string>({
      query: (id) => `/budgets/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Budget', id }],
    }),

    createBudget: builder.mutation<Budget, Partial<Budget>>({
      query: (newBudget) => ({
        url: '/budgets/',
        method: 'POST',
        body: newBudget,
      }),
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }],
    }),

    updateBudget: builder.mutation<Budget, { id: string; data: Partial<Budget> }>({
      query: (arg) => ({
        url: `/budgets/${arg.id}/`,
        method: 'PATCH',
        body: arg.data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Budget', id: arg.id },
        { type: 'Budget', id: 'LIST' },
      ],
    }),

    deleteBudget: builder.mutation<void, string>({
      query: (id) => ({
        url: `/budgets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Budget', id },
        { type: 'Budget', id: 'LIST' },
      ],
    }),
    getConsultants: builder.query({
      query: () => '/consultants/',
      providesTags: ['Consultant'],
      transformResponse: (response: any) => {
        // Si la réponse est un tableau direct
        if (Array.isArray(response)) {
          return {
            count: response.length,
            results: response,
          };
        }
        // Si la réponse a une structure paginée
        if (response && response.results) {
          return response;
        }
        return { count: 0, results: [] };
      },
    }),

    getConsultantById: builder.query({
      query: (id) => `/consultants/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Consultant', id }],
    }),

    // ✅ Clients
    registerClient: builder.mutation({
      query: (clientData) => ({
        url: '/clients/register/',
        method: 'POST',
        body: clientData,
      }),
    }),
    
    approveClient: builder.mutation({
      query: ({ id, action, justification }) => ({
        url: `/clients/${id}/approve-reject/`,
        method: 'PATCH',
        body: { action, justification },
      }),
      invalidatesTags: ['Client', 'Notification'],
    }),

       // 📝 INSCRIPTION POUR TOUS LES UTILISATEURS (chef_projet, consultant, partenaire, client)
    userRegister: builder.mutation<{ message: string; user_id: string; statut: string }, RegisterData>({
      query: (data) => ({
        url: '/users/register/',
        method: 'POST',
        body: data,
      }),
    }),

    // 📋 LISTE DES UTILISATEURS EN ATTENTE D'APPROBATION (Direction uniquement)
    getPendingUsers: builder.query<UsersListResponse, void>({
      query: () => '/users/pending/',
      providesTags: ['User'],
    }),

    // ✅ APPROUVER OU REJETER UN UTILISATEUR (Direction uniquement)
    approveRejectUser: builder.mutation<{ success: boolean; message: string }, ApproveRejectData>({
      query: ({ id, action, justification }) => ({
        url: `/users/${id}/approve-reject/`,
        method: 'PATCH',
        body: { action, justification },
      }),
      invalidatesTags: ['User', 'Notification'],
    }),

    // ... vos endpoints existants (login, getTaches, etc.)
    
    changerMotDePasse: builder.mutation({
      query: (data) => ({
        url: '/auth/changer-mot-de-passe/',
        method: 'POST',
        body: {
          ancien_mot_de_passe: data.ancien_mot_de_passe,
          nouveau_mot_de_passe: data.nouveau_mot_de_passe,
          confirmation: data.confirmation,
        },
      }),
    }),
    getChefsProjet: builder.query({
       query: (params) => ({
         url: '/chefs-projet/',
         params: {
           page: params?.page || 1,
           page_size: params?.pageSize || 100,
         },
        }),
     providesTags: ['User'],
    }),

    getChefProjetById: builder.query({
        query: (id) => `/chefs-projet/${id}/`,
        providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
  }),
});

// ========== EXPORT DES HOOKS ==========
export const {
  useChangerMotDePasseMutation, 
  // Projets
  useGetProjetsQuery,
  useGetProjetByIdQuery,
  useCreateProjetMutation,
  useUpdateProjetMutation,
  usePatchProjetMutation,
  useDeleteProjetMutation,
  useGetProjetMembresQuery,
  
  // Sous-tâches
  useGetSousTachesQuery,
  useGetSousTacheByIdQuery,
  useCreateSousTacheMutation,
  useUpdateSousTacheMutation,
  useDeleteSousTacheMutation,
  
  // Clients
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useRegisterClientMutation,
  useApproveClientMutation,
  
  // Partenaires
  useGetPartenairesQuery,
  useGetPartenaireByIdQuery,
  useCreatePartenaireMutation,
  useUpdatePartenaireMutation,
  useDeletePartenaireMutation,
  
  // Documents
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  
  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  
  // KPI
  useGetKPIsQuery,
  useGetKPIByIdQuery,
  useCreateKPIMutation,
  useUpdateKPIMutation,
  useDeleteKPIMutation,
  
  // Ressources
  useGetRessourcesQuery,
  useGetRessourceByIdQuery,
  useCreateRessourceMutation,
  useUpdateRessourceMutation,
  useDeleteRessourceMutation,
  
  // Tâches
  useGetTachesQuery,
  useGetTacheByIdQuery,
  useCreateTacheMutation,
  useUpdateTacheMutation,
  usePatchTacheMutation,
  useDeleteTacheMutation,
  
  // Authentification
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  
  // Mot de passe oublié
  useForgotPasswordMutation,
  useValidateResetTokenMutation,
  useResetPasswordMutation,
  
  // Consultants
  useGetConsultantsByProjetQuery,
  useGetConsultantsQuery,
  useGetConsultantByIdQuery,
  

  // Direction
  useUserRegisterMutation,
  useGetPendingUsersQuery,
  useApproveRejectUserMutation,
  
  // Budgets
  useGetBudgetsQuery,
  useGetBudgetByIdQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  // chefs 
  useGetChefsProjetQuery,
  useGetChefProjetByIdQuery,
  
} = api;

export default api;
