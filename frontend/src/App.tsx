import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RedirectIfAuthenticated from './components/common/RedirectIfAuthenticated';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import MyReportsPage from './pages/MyReportsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="upload" element={<UploadPage />} />
              <Route path="results/:id" element={<ResultsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="my-reports" element={<MyReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;