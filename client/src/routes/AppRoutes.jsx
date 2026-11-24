import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayout';
import AdminAttemptsPage from '../pages/Admin/AdminAttemptsPage';
import AdminCategoriesPage from '../pages/Admin/AdminCategoriesPage';
import AdminQuestionsPage from '../pages/Admin/AdminQuestionsPage';
import AdminQuizzesPage from '../pages/Admin/AdminQuizzesPage';
import AdminSubjectsPage from '../pages/Admin/AdminSubjectsPage';
import AdminUsersPage from '../pages/Admin/AdminUsersPage';
import AdminDashboardPage from '../pages/AdminDashboardPage/AdminDashboardPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage/DashboardPage';
import HomePage from '../pages/HomePage/HomePage';
import LeaderboardPage from '../pages/Leaderboard/LeaderboardPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import QuizAttemptPage from '../pages/QuizAttempt/QuizAttemptPage';
import StartQuizPage from '../pages/QuizAttempt/StartQuizPage';
import QuizDetailPage from '../pages/Quizzes/QuizDetailPage';
import QuizzesPage from '../pages/Quizzes/QuizzesPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import QuizSubmittedPage from '../pages/Results/QuizSubmittedPage';
import SubjectDetailPage from '../pages/Subjects/SubjectDetailPage';
import SubjectsPage from '../pages/Subjects/SubjectsPage';

function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id" element={<SubjectDetailPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/quizzes/:id" element={<QuizDetailPage />} />

        {/* Protected Student/Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/history" element={<ReportsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/quiz/:id/start" element={<StartQuizPage />} />
          <Route path="/quiz/:attemptId" element={<QuizAttemptPage />} />
          <Route path="/results/:attemptId" element={<QuizSubmittedPage />} />
        </Route>

        {/* Admin-Only Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="subjects" element={<AdminSubjectsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="quizzes" element={<AdminQuizzesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="attempts" element={<AdminAttemptsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default AppRoutes;
