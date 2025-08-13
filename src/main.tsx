import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { Provider as ReduxProvider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { store } from './store/store'
import './index.css'
import App from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { AuthGate } from './features/auth/AuthGate'
import { registerSW } from 'virtual:pwa-register'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import 'leaflet/dist/leaflet.css'

registerSW({ immediate: true })

const AuthPage = lazy(() => import('./pages/AuthPage'))
const CheckEmailPage = lazy(() => import('./pages/CheckEmailPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'))
const AdminDictsPage = lazy(() => import('./pages/admin/DictsPage'))
const FishKindsPage = lazy(() => import('./pages/admin/FishKindsPage'))
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGate>
        <App />
      </AuthGate>
    ),
    children: [
      { index: true, element: <Suspense fallback={null}><HomePage /></Suspense> },
      { path: 'map', element: <Suspense fallback={null}><MapPage /></Suspense> },
      {
        path: 'admin',
        element: <AuthGate roles={["admin"]}><Suspense fallback={null}><AdminPage /></Suspense></AuthGate>,
        children: [
          { index: true, element: <Suspense fallback={null}><AdminUsersPage /></Suspense> },
          { path: 'users', element: <Suspense fallback={null}><AdminUsersPage /></Suspense> },
          { path: 'dicts', element: <Suspense fallback={null}><AdminDictsPage /></Suspense> },
          { path: 'dicts/fish', element: <Suspense fallback={null}><FishKindsPage /></Suspense> },
        ],
      },
    ],
  },
  { path: '/auth', element: <Suspense fallback={null}><AuthPage /></Suspense> },
  { path: '/check-email', element: <Suspense fallback={null}><CheckEmailPage /></Suspense> },
])

const queryClient = new QueryClient()

const colorSchemeManager = localStorageColorSchemeManager({ key: 'fishdvizh-color-scheme' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
          <ModalsProvider modalProps={{ zIndex: 10000, overlayProps: { opacity: 0.55, blur: 2 } }}>
            <Notifications position="top-right" />
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </ModalsProvider>
        </MantineProvider>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
)
