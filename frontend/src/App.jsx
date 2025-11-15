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
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';           // ✅ Correct import
import AdminTournaments from './pages/admin/AdminTournaments'; // ✅ Admin page

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected user route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ✅ New Admin route */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminTournaments />
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
