// src/components/TestApi.tsx
import { useGetProjetsQuery } from '../../store/api/api';

export function TestApi() {
  const { data, isLoading, error } = useGetProjetsQuery({ page: 1 });
  
  if (isLoading) return <div>Connexion à Django...</div>;
  if (error) return <div>Erreur: {JSON.stringify(error)}</div>;
  
  return (
    <div>
      <h2>✅ Connexion réussie !</h2>
      <p>Nombre de projets: {data?.count || 0}</p>
    </div>
  );
}