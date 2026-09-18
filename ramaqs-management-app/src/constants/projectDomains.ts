export const PROJECT_DOMAINS = [
  'Général', 'Transformation Digitale', 'Intelligence Artificielle', 'Cloud',
  'Sécurité', 'Data', 'Industrie 4.0', 'Conseil & formation', 'Telecom',
  'Agriculture', 'Santé', 'Agroalimentaire', 'IA', 'IoT', 'AgriTech',
  'WaterTech', 'ClimateTech', 'HealthTech', 'GovTech', 'FinTech', 'SaaS',
  'FoodTech', 'Post-Harvest', 'GreenTech', 'MarTech', 'Smart City',
  'CleanTech', 'EdTech', 'Digital Governance', 'ERP/MES/BI/LEAN', 'Industrie',
  'PetTech', 'MedTech', 'RoadTech', 'SoilTech',
] as const;

export const PROJECT_DOMAIN_SET = new Set<string>(PROJECT_DOMAINS);

export function normalizeProjectDomains(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((domain): domain is string => typeof domain === 'string' && domain.trim() !== '');
  }
  if (typeof value === 'string' && value.trim() !== '') return [value];
  return [];
}
