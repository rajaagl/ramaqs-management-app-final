import { createFileRoute } from '@tanstack/react-router';
import CalendrierEcheances from '@/components/Calendar/CalendrierEcheances';
import { AppShell } from '#/components/AppShell';

export const Route = createFileRoute('/app/calendrier')({
  component: CalendrierEcheances,
});