import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FullSpinner } from '@/components/shared/UI';
import AuthPage from '@/components/auth/AuthPage';
import CustomerDashboard from '@/components/customer/CustomerDashboard';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import TechnicianDashboard from '@/components/technician/TechnicianDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FullSpinner label="Loading Fixora..." />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'manager': return <ManagerDashboard />;
    case 'technician': return <TechnicianDashboard />;
    default: return <CustomerDashboard />;
  }
};

export default AppLayout;
