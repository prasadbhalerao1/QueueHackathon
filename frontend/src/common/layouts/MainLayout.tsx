import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Alert } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { logout } from '../../modules/auth/hooks/useAuth';

export const MainLayout: React.FC = () => {
  const role = localStorage.getItem('user_role') || 'Unknown';
  const userName = localStorage.getItem('user_name') || 'User';
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', filter: isOffline ? 'grayscale(100%)' : 'none', transition: 'filter 0.5s ease' }}>
      {isOffline && (
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 0, justifyContent: 'center', fontWeight: 'bold' }}>
          YOU ARE OFFLINE. Operations are being cached locally and will sync when connection is restored.
        </Alert>
      )}
      <AppBar position="static" color={isOffline ? 'inherit' : 'primary'} sx={{ boxShadow: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            QueueOS - {role === 'ADMIN' ? 'Admin Control' : role === 'OFFICER' ? 'Officer Panel' : 'Staff Panel'}
          </Typography>
          <Typography variant="body1" sx={{ mr: 2, fontWeight: 'bold' }}>
            Welcome, {userName}
          </Typography>
          <Button color="inherit" onClick={logout} sx={{ fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1, px: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, bgcolor: '#f5f5f5' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
