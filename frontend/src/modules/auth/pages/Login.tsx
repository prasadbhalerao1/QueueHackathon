import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { LockOutlined, BadgeOutlined } from '@mui/icons-material';
import { useLoginMutation } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { mutate: staffLogin, isPending } = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    staffLogin(
      { phone, password },
      {
        onSuccess: (data: any) => {
          if (data.role === 'ADMIN') navigate('/admin');
          else navigate('/staff');
        },
        onError: (error: any) => {
          setErrorMsg(error.response?.data?.message || 'Login failed. Please check your credentials.');
        },
      }
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f0f4ff',
        p: 2,
        background: 'linear-gradient(135deg, #e8eaf6 0%, #e3f2fd 100%)',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Header Band */}
        <Box sx={{ bgcolor: 'primary.main', py: 3, px: 4, textAlign: 'center' }}>
          <LockOutlined sx={{ color: 'white', fontSize: 36, mb: 1 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
            Staff & Admin Portal
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            QueueOS Secure Access
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              id="login-phone"
              label="Phone Number"
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
              placeholder="e.g. 9999999999"
              slotProps={{ htmlInput: { 'aria-label': 'Phone Number', minLength: 10, maxLength: 13 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              id="login-password"
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{ htmlInput: { 'aria-label': 'Password' } }}
              sx={{ mb: 3 }}
            />

            <Button
              id="login-submit"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', borderRadius: 2 }}
              disabled={isPending || !phone || !password}
            >
              {isPending ? <CircularProgress size={24} color="inherit" /> : 'Log In to Dashboard'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          {/* Citizen Helper */}
          <Box sx={{ textAlign: 'center' }}>
            <BadgeOutlined sx={{ color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Are you a citizen looking for your token?
            </Typography>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="primary"
              size="small"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Track My Token on Home Page
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
