import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/taches/add')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/taches/add"!</div>
}
