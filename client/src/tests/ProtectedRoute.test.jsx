import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AdminRoute from '../components/AdminRoute/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { AuthContext } from '../context/contexts';

const renderWithAuth = (authValue, initialPath) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Student Dashboard</div>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin Console</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute & AdminRoute', () => {
  it('redirects unauthenticated user to /login', () => {
    renderWithAuth(
      { isAuthenticated: false, isAdmin: false, loading: false },
      '/dashboard'
    );
    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('allows authenticated student to access /dashboard and denies /admin', () => {
    renderWithAuth(
      { isAuthenticated: true, isAdmin: false, loading: false },
      '/dashboard'
    );
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();

    renderWithAuth(
      { isAuthenticated: true, isAdmin: false, loading: false },
      '/admin'
    );
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('allows admin user into /admin', () => {
    renderWithAuth(
      { isAuthenticated: true, isAdmin: true, loading: false },
      '/admin'
    );
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
  });
});
