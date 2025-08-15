import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import AuthPage from './pages/AuthPage'
import CheckEmailPage from './pages/CheckEmailPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import TeamPage from './pages/TeamPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'check-email', element: <CheckEmailPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'team/:teamId', element: <TeamPage /> },
    ],
  },
])
