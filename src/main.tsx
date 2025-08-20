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
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const TrainingPage = lazy(() => import('./pages/TrainingPage'))
const CompetitionPage = lazy(() => import('./pages/CompetitionPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'))
const AdminDictsPage = lazy(() => import('./pages/admin/DictsPage'))
const FishKindsPage = lazy(() => import('./pages/admin/FishKindsPage'))
const CompetitionFormatsPage = lazy(() => import('./pages/admin/CompetitionFormatsPage'))
const TeamSizesPage = lazy(() => import('./pages/admin/TeamSizesPage'))
const BaitsPage = lazy(() => import('./pages/admin/BaitsPage'))
const BaitManufacturersPage = lazy(() => import('./pages/admin/BaitManufacturersPage'))
const BaitTypesPage = lazy(() => import('./pages/admin/BaitTypesPage'))
const ScoreboardPage = lazy(() => import('./pages/ScoreboardPage'))
const ResultsPublicPage = lazy(() => import('./pages/ResultsPublicPage'))
const JudgePage = lazy(() => import('./pages/JudgePage'))
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
      { path: 'competitions', element: <Suspense fallback={null}><CompetitionsPage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={null}><ProfilePage /></Suspense> },
      { path: 'team/:teamId', element: <Suspense fallback={null}><TeamPage /></Suspense> },
      { path: 'competition/:competitionId', element: <Suspense fallback={null}><CompetitionPage /></Suspense> },
      {
        path: 'admin',
        element: <AuthGate roles={["admin"]}><Suspense fallback={null}><AdminPage /></Suspense></AuthGate>,
        children: [
          { index: true, element: <Suspense fallback={null}><AdminUsersPage /></Suspense> },
          { path: 'users', element: <Suspense fallback={null}><AdminUsersPage /></Suspense> },
          { path: 'dicts', element: <Suspense fallback={null}><AdminDictsPage /></Suspense> },
          { path: 'dicts/fish', element: <Suspense fallback={null}><FishKindsPage /></Suspense> },
          { path: 'dicts/formats', element: <Suspense fallback={null}><CompetitionFormatsPage /></Suspense> },
          { path: 'dicts/team-sizes', element: <Suspense fallback={null}><TeamSizesPage /></Suspense> },
          { path: 'dicts/bait-manufacturers', element: <Suspense fallback={null}><BaitManufacturersPage /></Suspense> },
          { path: 'dicts/bait-types', element: <Suspense fallback={null}><BaitTypesPage /></Suspense> },
          { path: 'dicts/baits', element: <Suspense fallback={null}><BaitsPage /></Suspense> },
        ],
      },
    ],
  },
  { path: '/auth', element: <Suspense fallback={null}><AuthPage /></Suspense> },
  { path: '/check-email', element: <Suspense fallback={null}><CheckEmailPage /></Suspense> },
  { path: '/scoreboard/:competitionId', element: <Suspense fallback={null}><ScoreboardPage /></Suspense> },
  { path: '/results/:competitionId', element: <Suspense fallback={null}><ResultsPublicPage /></Suspense> },
  { path: '/judge/:competitionId', element: <Suspense fallback={null}><JudgePage /></Suspense> },
  { path: '/training/:trainingId', element: <Suspense fallback={null}><TrainingPage /></Suspense> },
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
