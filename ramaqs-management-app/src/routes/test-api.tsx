// src/routes/test-api.tsx
import { createFileRoute } from '@tanstack/react-router'
import { TestApi } from '../components/ui/testApi'

export const Route = createFileRoute('/test-api')({
  component: TestApi,
})