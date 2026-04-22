import React, { useState } from 'react';
import { Box, Typography, Button, Container, TextField, Paper, Grid } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/track/${tokenInput.trim().toUpperCase()}`);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0
      }} />

      {/* Main Content */}
      <Container maxWidth="md" sx={{ mt: { xs: 8, md: 15 }, mb: 8, zIndex: 1, position: 'relative' }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            gutterBottom 
            sx={{ 
              fontWeight: 900, 
              background: 'linear-gradient(90deg, #0f172a 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            QueueOS
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
            The Smart Infrastructure for Public Services. Skip the waiting room and track your spot in real-time.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
          {/* Tracking Card */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 5 }, 
                borderRadius: 4, 
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                Track Your Token
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                Enter your token number to see your live position in the queue.
              </Typography>

              <form onSubmit={handleTrack}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    placeholder="e.g. W-101"
                    variant="outlined"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    sx={{ bgcolor: 'white' }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    size="large"
                    disabled={!tokenInput.trim()}
                    sx={{ px: 4, minWidth: '120px' }}
                  >
                    Track
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          {/* Login Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 5 }, 
                borderRadius: 4, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 700 }}>
                Access Portal
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                Citizens and Staff can log in here to manage tokens and queues.
              </Typography>
              <Button 
                component={Link} 
                to="/login" 
                variant="outlined" 
                color="secondary"
                size="large" 
                fullWidth
                sx={{ 
                  borderWidth: '2px', 
                  '&:hover': { borderWidth: '2px', bgcolor: 'secondary.main', color: 'white' }
                }}
              >
                Log In
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
