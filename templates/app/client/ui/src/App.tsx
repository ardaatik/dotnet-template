import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { RequirePermission } from './components/auth/RequirePermission';
import MainLayout from './components/layout/MainLayout';
import { Permissions } from './constants/permissions';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import { CreateTodoPage } from './features/todos/CreateTodoPage';
import { EditTodoPage } from './features/todos/EditTodoPage';
import { TodoDetailsPage } from './features/todos/TodoDetailsPage';
import { TodosPage } from './features/todos/TodosPage';
import Profile from './features/users/Profile';
import Forbidden from './pages/Forbidden';
import Settings from './pages/Settings';

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<TodosPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/todos/create" element={<CreateTodoPage />} />
        <Route path="/todos/:id" element={<TodoDetailsPage />} />
        <Route path="/todos/:id/edit" element={<EditTodoPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/settings"
          element={
            <RequirePermission permission={Permissions.MANAGE_ROLES}>
              <Settings />
            </RequirePermission>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="dotnet-template-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
