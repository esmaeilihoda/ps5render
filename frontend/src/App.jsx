import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TournamentsPage from './pages/TournamentsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import WalletPage from './pages/WalletPage';
import TournamentDetailsPage from './pages/TournamentDetailsPage';
import GameHubPage from './pages/GameHubPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';           // ✅ Correct import
import AdminTournaments from './pages/admin/AdminTournaments'; // ✅ Admin page
import AdminTournamentDetail from './pages/admin/AdminTournamentDetail'; // ✅ Detail page
import AdminTransactions from './pages/admin/AdminTransactions';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
            <Route path="/games/:gameId" element={<GameHubPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected user routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminTournaments />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/tournaments"
              element={
                <AdminRoute>
                  <AdminTournaments />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/tournaments/:id"
              element={
                <AdminRoute>
                  <AdminTournamentDetail />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/transactions"
              element={
                <AdminRoute>
                  <AdminTransactions />
                </AdminRoute>
              }
            />

            {/* Optional fallback */}
            {/* <Route path="*" element={<HomePage />} /> */}
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
