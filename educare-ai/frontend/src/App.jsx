import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PortalLayout from './components/PortalLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassListPage from './pages/ClassListPage';
import UploadPage from './pages/UploadPage';
import StudentRiskListPage from './pages/StudentRiskListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import InterventionPage from './pages/InterventionPage';
import CoursesListPage from './pages/teacher/CoursesListPage';
import CourseDetailPage from './pages/teacher/CourseDetailPage';
import LectureFormPage from './pages/teacher/LectureFormPage';
import ResourceFormPage from './pages/teacher/ResourceFormPage';
import AssignmentFormPage from './pages/teacher/AssignmentFormPage';
import TeacherLecturesPage from './pages/teacher/TeacherLecturesPage';
import TeacherAssignmentsPage from './pages/teacher/TeacherAssignmentsPage';
import LearningMonitorPage from './pages/teacher/LearningMonitorPage';
import PortalOverviewPage from './pages/portal/PortalOverviewPage';
import PortalCoursesPage from './pages/portal/PortalCoursesPage';
import PortalCourseDetailPage from './pages/portal/PortalCourseDetailPage';
import PortalLecturePage from './pages/portal/PortalLecturePage';
import PortalResourcePage from './pages/portal/PortalResourcePage';
import PortalAssignmentsPage from './pages/portal/PortalAssignmentsPage';
import PortalAssignmentDetailPage from './pages/portal/PortalAssignmentDetailPage';
import PortalProgressPage from './pages/portal/PortalProgressPage';
import PortalPredictionPage from './pages/portal/PortalPredictionPage';
import PortalSuggestionsPage from './pages/portal/PortalSuggestionsPage';

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
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route path="courses/:courseId/lectures/new" element={<LectureFormPage />} />
        <Route path="courses/:courseId/resources/new" element={<ResourceFormPage />} />
        <Route path="courses/:courseId/assignments/new" element={<AssignmentFormPage />} />
        <Route path="lectures" element={<TeacherLecturesPage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="students" element={<StudentRiskListPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="interventions" element={<InterventionPage />} />
        <Route path="learning-monitor" element={<LearningMonitorPage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PortalOverviewPage />} />
        <Route path="courses" element={<PortalCoursesPage />} />
        <Route path="courses/:courseId" element={<PortalCourseDetailPage />} />
        <Route path="lectures/:lectureId" element={<PortalLecturePage />} />
        <Route path="resources/:resourceId" element={<PortalResourcePage />} />
        <Route path="assignments" element={<PortalAssignmentsPage />} />
        <Route path="assignments/:assignmentId" element={<PortalAssignmentDetailPage />} />
        <Route path="progress" element={<PortalProgressPage />} />
        <Route path="prediction" element={<PortalPredictionPage />} />
        <Route path="suggestions" element={<PortalSuggestionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
