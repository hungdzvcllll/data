import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassListPage from './pages/ClassListPage';
import UploadPage from './pages/UploadPage';
import StudentRiskListPage from './pages/StudentRiskListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import InterventionPage from './pages/InterventionPage';
import StudentPortalPage from './pages/StudentPortalPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="classes" element={<ClassListPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="students" element={<StudentRiskListPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="interventions" element={<InterventionPage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <StudentPortalPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
