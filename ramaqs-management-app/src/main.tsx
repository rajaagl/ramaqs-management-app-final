// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './styles.css'
import { Provider } from 'react-redux'
import { store } from './store/store'

// Importez la route racine
import { routeTree } from './routeTree.gen'


// Créez le router
const router = createRouter({ routeTree })

// Enregistrez le router pour les types TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Rendez l'application
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <Provider store={store}>
      <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>
  )
}