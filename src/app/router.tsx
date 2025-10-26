import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import { AuthGate } from '@/features/auth/AuthGate'

const AuthPage = lazy(() => import('@/pages/AuthPage'))
const CheckEmailPage = lazy(() => import('@/pages/CheckEmailPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const CompetitionsPage = lazy(() => import('@/pages/CompetitionsPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const TrainingPage = lazy(() => import('@/pages/TrainingPage'))
const OnWaterTrainingPage = lazy(() => import('@/pages/OnWaterTrainingPage'))
const CompetitionPage = lazy(() => import('@/pages/CompetitionPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'))
const AdminDictsPage = lazy(() => import('@/pages/admin/DictsPage'))
const FishKindsPage = lazy(() => import('@/pages/admin/FishKindsPage'))
const CompetitionFormatsPage = lazy(() => import('@/pages/admin/CompetitionFormatsPage'))
const TeamSizesPage = lazy(() => import('@/pages/admin/TeamSizesPage'))
const BaitsPage = lazy(() => import('@/pages/admin/BaitsPage'))
const BaitManufacturersPage = lazy(() => import('@/pages/admin/BaitManufacturersPage'))
const BaitTypesPage = lazy(() => import('@/pages/admin/BaitTypesPage'))
const ScoreboardPage = lazy(() => import('@/pages/ScoreboardPage'))
const ResultsPublicPage = lazy(() => import('@/pages/ResultsPublicPage'))
const JudgePage = lazy(() => import('@/pages/JudgePage'))
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'))
const LeaguesPage = lazy(() => import('@/pages/LeaguesPage'))
const LeaguePage = lazy(() => import('@/pages/LeaguePage'))
const LeagueAdminPage = lazy(() => import('@/pages/LeagueAdminPage'))
const InvitationPage = lazy(() => import('@/pages/InvitationPage'))
const RatingConfigsPage = lazy(() => import('@/pages/RatingConfigsPage'))
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ExportPage = lazy(() => import('@/pages/ExportPage'))
const BonusesPage = lazy(() => import('@/pages/BonusesPage'))

// Profile sub-pages
const ProfileSettingsPage = lazy(() => import('@/pages/profile/SettingsPage'))
const ProfileTeamsPage = lazy(() => import('@/pages/profile/TeamsPage'))
const ProfileInvitationsPage = lazy(() => import('@/pages/profile/InvitationsPage'))
const ProfileTrainingsPage = lazy(() => import('@/pages/profile/TrainingsPage'))
const ProfileBaitsPage = lazy(() => import('@/pages/profile/BaitsPage'))
const ProfileAchievementsPage = lazy(() => import('@/pages/profile/AchievementsPage'))
const PublicProfilePage = lazy(() => import('@/pages/PublicProfilePage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const TeamsPage = lazy(() => import('@/pages/TeamsPage'))

// Competition sub-pages
const CompetitionOverviewPage = lazy(() => import('@/pages/competition/OverviewPage'))
const CompetitionTeamsPage = lazy(() => import('@/pages/competition/TeamsPage'))
const CompetitionResultsPage = lazy(() => import('@/pages/competition/ResultsPage'))
const CompetitionJudgesPage = lazy(() => import('@/pages/competition/JudgesPage'))
const CompetitionSchedulePage = lazy(() => import('@/pages/competition/SchedulePage'))
const CompetitionZonesPage = lazy(() => import('@/pages/competition/ZonesPage'))

export const router = createBrowserRouter([
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
      { path: 'leagues', element: <Suspense fallback={null}><LeaguesPage /></Suspense> },
      { path: 'league/:leagueId', element: <Suspense fallback={null}><LeaguePage /></Suspense> },
      { path: 'invitation/:token', element: <Suspense fallback={null}><InvitationPage /></Suspense> },
      { 
        path: 'profile',
        element: <Suspense fallback={null}><ProfilePage /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={null}><ProfileSettingsPage /></Suspense> },
          { path: 'settings', element: <Suspense fallback={null}><ProfileSettingsPage /></Suspense> },
          { path: 'teams', element: <Suspense fallback={null}><ProfileTeamsPage /></Suspense> },
          { path: 'invitations', element: <Suspense fallback={null}><ProfileInvitationsPage /></Suspense> },
          { path: 'trainings', element: <Suspense fallback={null}><ProfileTrainingsPage /></Suspense> },
          { path: 'baits', element: <Suspense fallback={null}><ProfileBaitsPage /></Suspense> },
          { path: 'achievements', element: <Suspense fallback={null}><ProfileAchievementsPage /></Suspense> },
        ]
      },
      { path: 'notifications', element: <Suspense fallback={null}><NotificationsPage /></Suspense> },
      { path: 'leaderboard', element: <Suspense fallback={null}><LeaderboardPage /></Suspense> },
      { path: 'users', element: <Suspense fallback={null}><UsersPage /></Suspense> },
      { path: 'teams-list', element: <Suspense fallback={null}><TeamsPage /></Suspense> },
      { path: 'user/:userId', element: <Suspense fallback={null}><PublicProfilePage /></Suspense> },
      { path: 'team/:teamId', element: <Suspense fallback={null}><TeamPage /></Suspense> },
      {
        path: 'competition/:competitionId',
        element: <Suspense fallback={null}><CompetitionPage /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={null}><CompetitionOverviewPage /></Suspense> },
          { path: 'overview', element: <Suspense fallback={null}><CompetitionOverviewPage /></Suspense> },
          { path: 'teams', element: <Suspense fallback={null}><CompetitionTeamsPage /></Suspense> },
          { path: 'results', element: <Suspense fallback={null}><CompetitionResultsPage /></Suspense> },
          { path: 'judges', element: <Suspense fallback={null}><CompetitionJudgesPage /></Suspense> },
          { path: 'schedule', element: <Suspense fallback={null}><CompetitionSchedulePage /></Suspense> },
          { path: 'zones', element: <Suspense fallback={null}><CompetitionZonesPage /></Suspense> },
        ]
      },
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
          { path: 'rating-configs', element: <Suspense fallback={null}><RatingConfigsPage /></Suspense> },
          { path: 'achievements', element: <Suspense fallback={null}><AchievementsPage /></Suspense> },
          { path: 'bonuses', element: <Suspense fallback={null}><BonusesPage /></Suspense> },
          { path: 'export', element: <Suspense fallback={null}><ExportPage /></Suspense> },
          { path: 'league/:leagueId', element: <Suspense fallback={null}><LeagueAdminPage /></Suspense> },
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
  { path: '/training/:trainingId/water', element: <Suspense fallback={null}><OnWaterTrainingPage /></Suspense> },
])


