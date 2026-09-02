import { Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed, RequireAuth } from '@/routes/guards'
import { AuthPage } from '@/pages/auth-page'
import { UserDashboard } from '@/pages/user-dashboard'
import { LeaderboardPage } from '@/pages/leaderboard-page'
import { AdminRespondenPage } from '@/pages/admin-responden-page'
import { AdminDetailPage } from '@/pages/admin-detail-page'
import { AdminManagementPage } from '@/pages/admin-management-page'
import { ProfilePage } from '@/pages/profile-page'
import { NotFoundPage } from '@/pages/not-found-page'

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <AuthPage mode="login" />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <AuthPage mode="register" />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <UserDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/submit"
        element={
          <RequireAuth>
            <UserDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <LeaderboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profil"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth adminOnly>
            <AdminRespondenPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/responden/:userId"
        element={
          <RequireAuth adminOnly>
            <AdminDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/leaderboard"
        element={
          <RequireAuth adminOnly>
            <LeaderboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/management"
        element={
          <RequireAuth adminOnly>
            <AdminManagementPage />
          </RequireAuth>
        }
      />

      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
