import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SitesPage from './pages/sites/SitesPage';
import SiteDashboardPage from './pages/sites/SiteDashboardPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import QuotationDetailPage from './pages/quotations/QuotationDetailPage';

const PrivateRoute = ({ children }) => {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { admin } = useAuth();
  return !admin ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="sites/:id" element={<SiteDashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
