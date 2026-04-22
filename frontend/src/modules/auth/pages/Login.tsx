import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import { useLoginMutation, useCitizenLoginMutation } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0 = Citizen, 1 = Staff
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { mutate: staffLogin, isPending: isStaffPending } = useLoginMutation();
  const { mutate: citizenLogin, isPending: isCitizenPending } = useCitizenLoginMutation();
  const navigate = useNavigate();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setErrorMsg('');
    setPhone('');
    setPassword('');
  };

  const handleSuccess = (data: any) => {
    if (data.role === 'ADMIN') {
      navigate('/admin');
    } else if (data.role === 'OFFICER') {
      navigate('/staff');
    } else {
      navigate('/track');
    }
  };

  const handleError = (error: any) => {
    setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (tabIndex === 0) {
      citizenLogin({ phone }, { onSuccess: handleSuccess, onError: handleError });
    } else {
      staffLogin({ phone, password }, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  const isPending = isStaffPending || isCitizenPending;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "#f8fafc", p: 2 }}>
      <Card sx={{ maxWidth: 450, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary" sx={{ fontWeight: '900' }}>
            QueueOS Access
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please select your portal below to log in.
          </Typography>
          
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Citizen Portal" sx={{ fontWeight: 'bold' }} />
            <Tab label="Staff Access" sx={{ fontWeight: 'bold' }} />
          </Tabs>

          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          
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
              placeholder="e.g. 7771234567"
              sx={{ mb: tabIndex === 0 ? 3 : 1 }}
            />
            
            {tabIndex === 1 && (
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
            )}

            {tabIndex === 0 && (
              <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 3 }}>
                No password required. Enter your registered phone number to access your tokens.
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
              disabled={isPending}
            >
              {isPending ? <CircularProgress size={24} color="inherit" /> : (tabIndex === 0 ? 'Access My Tokens' : 'Log In to Dashboard')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
