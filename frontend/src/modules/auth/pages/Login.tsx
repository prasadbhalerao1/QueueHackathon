import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useLoginMutation } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { mutate: login, isPending } = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    login(
      { phone, password },
      {
        onSuccess: (data) => {
          if (data.role === 'ADMIN') {
            navigate('/admin');
          } else if (data.role === 'OFFICER') {
            navigate('/staff');
          } else {
            navigate('/track');
          }
        },
        onError: (error: any) => {
          setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
        }
      }
    );
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5" p={2}>
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom align="center">
            QueueOS Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Enter your staff credentials to access the dashboard.
          </Typography>
          
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Phone Number"
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
              disabled={isPending}
            >
              {isPending ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
