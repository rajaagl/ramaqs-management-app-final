// src/routes/test-api.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { TestApi } from '../components/ui/testApi'

export const Route = createFileRoute('/test-api')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
  component: TestApi,
})
