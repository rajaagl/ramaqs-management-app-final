import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/partenaires')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/partenaires"!</div>
}
