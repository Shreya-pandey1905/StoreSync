import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Inventory from './pages/Inventory.tsx';
import Sales from './pages/Sales.tsx';
import NewSale from './pages/NewSale.tsx';
import User from './pages/User.tsx';
import Roles from './pages/Roles.tsx';
import ProductForm from './pages/ProductForm.tsx';
import Analytics from './pages/Analytics.tsx';
import Settings from './pages/Settings.tsx';
import Suppliers from './pages/Suppliers.tsx';
import Stores from './pages/Stores.tsx';
import Profile from './pages/Profile.tsx';
import Sidebar from './components/Sidebar.tsx';
import Navbar from './components/Navbar.tsx';
import { DarkModeProvider } from './context/DarkModeContext.tsx';
import { PermissionProvider } from './context/PermissionContext.tsx';
import { useDarkMode } from './context/DarkModeContext.tsx';
import { isAuthenticated } from './services/authService.ts';

const AuthenticatedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode } = useDarkMode();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const authenticated = isAuthenticated();
  return authenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with PermissionProvider */}
          <Route element={
            <PermissionProvider>
              <RequireAuth>
                <AuthenticatedLayout />
              </RequireAuth>
            </PermissionProvider>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/add-product" element={<ProductForm />} />
            <Route path="/edit-product/:id" element={<ProductForm />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/sales/:id/edit" element={<NewSale />} />

            <Route path="/users" element={<User />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;