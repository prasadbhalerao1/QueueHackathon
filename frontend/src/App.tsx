import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './modules/auth/pages/Login';
import { StaffDashboard } from './modules/queue/components/StaffDashboard';
import { AdminDashboard } from './modules/admin/components/AdminDashboard';
import { CitizenTracker } from './modules/queue/pages/CitizenTracker';
import { CitizenDashboard } from './modules/queue/pages/CitizenDashboard';
import { ProtectedRoute } from './common/components/ProtectedRoute';
import { MainLayout } from './common/layouts/MainLayout';
import { LandingPage } from './common/pages/LandingPage';
import { Box, Typography, Button } from '@mui/material';
import { logout } from './modules/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { syncOfflineMutations } from './common/utils/offlineSync';

const Unauthorized = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" color="error" gutterBottom>403 - Unauthorized</Typography>
    <Typography variant="body1" sx={{ mb: 3 }}>You do not have permission to view this page.</Typography>
    <Button variant="contained" onClick={logout}>Log Out</Button>
  </Box>
);



export const App: React.FC = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handleOnline = () => {
      syncOfflineMutations(queryClient);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/track/:tokenNumber" element={<CitizenTracker />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes for Citizens */}
        <Route element={<ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']} />}>
          <Route element={<MainLayout />}>
            <Route path="/track" element={<CitizenDashboard />} />
          </Route>
        </Route>
        
        {/* Protected Routes for Staff */}
        <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
          <Route element={<MainLayout />}>
            <Route path="/staff" element={<StaffDashboard />} />
          </Route>
        </Route>
        
        {/* Protected Routes for Admin Only */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
