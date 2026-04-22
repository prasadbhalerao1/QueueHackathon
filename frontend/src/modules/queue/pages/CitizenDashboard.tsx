import React from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Button, Container, Grid, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../../common/api';
import { Token, QueueStatus, JSendResponse } from '../types';

export const CitizenDashboard: React.FC = () => {
  const { data: response, isLoading, isError } = useQuery<JSendResponse<Token[]>>({
    queryKey: ['my-tokens'],
    queryFn: async () => {
      const res = await api.get('/api/queue/my-tokens');
      return res.data;
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  const tokens = response?.data || [];
  
  // Filter active vs completed tokens
  const activeTokens = tokens.filter(t => [QueueStatus.BOOKED, QueueStatus.ARRIVED, QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS].includes(t.status));
  const pastTokens = tokens.filter(t => [QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED].includes(t.status));

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: '#1e293b', mb: 4 }}>
        My Tokens
      </Typography>

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Active Tokens
      </Typography>
      
      {activeTokens.length === 0 ? (
        <Card sx={{ mb: 6, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body1" color="text.secondary" mb={2}>
              You don't have any active tokens in the queue right now.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {activeTokens.map(token => (
            <Grid item xs={12} sm={6} key={token.id}>
              <Card elevation={3} sx={{ borderRadius: 3, borderLeft: '6px solid #1976d2' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {token.token_number}
                    </Typography>
                    <Chip 
                      label={token.status.replace('_', ' ')} 
                      color={token.status === QueueStatus.CALLED ? "success" : "primary"} 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    <strong>Expected Time:</strong> {new Date(token.expected_service_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Button 
                    component={Link} 
                    to={`/track/${token.token_number}`} 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 2 }}
                  >
                    Track Live Status
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pastTokens.length > 0 && (
        <>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            History
          </Typography>
          <Grid container spacing={2}>
            {pastTokens.slice(0, 5).map(token => (
              <Grid item xs={12} key={token.id}>
                <Card elevation={1}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {token.token_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(token.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={token.status.replace('_', ' ')} 
                      color={token.status === QueueStatus.COMPLETED ? "default" : "error"} 
                      variant="outlined"
                      size="small" 
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};
