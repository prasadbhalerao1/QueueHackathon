import React, { useState } from 'react';
import { Box, Container, Typography, Card, Grid, Chip, Button, Stack, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Divider } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/api';
import { Token, QueueStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { LocationOn, Event, LogoutOutlined, AddCircleOutlined } from '@mui/icons-material';
import { AIChatWidget } from '../components/AIChatWidget';
import { logout } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../common/components/LanguageToggle';

// Citizen Dashboard to view history and manage active bookings
export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // UI State for Dialogs and Toasts
  const [rescheduleData, setRescheduleData] = useState<{open: boolean, tokenId: string, time: string}>({open: false, tokenId: '', time: ''});
  const [toast, setToast] = useState<{open: boolean, msg: string, type: 'success' | 'info' | 'error' | 'warning'}>({open: false, msg: '', type: 'success'});

  // Fetch tokens for the logged-in citizen
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['my-tokens'],
    queryFn: async () => {
      const { data } = await api.get('/api/queue/my-tokens');
      return data.data as Token[];
    }
  });

  // Mutation to cancel an appointment
  const { mutate: cancelToken, isPending: isCanceling } = useMutation({
    mutationFn: async (tokenId: string): Promise<any> => {
      const { data } = await api.patch(`/api/queue/cancel/${tokenId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tokens'] });
      setToast({open: true, msg: 'Appointment Cancelled', type: 'info'});
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setToast({open: true, msg: err.response?.data?.message || 'Error canceling', type: 'error'});
    }
  });

  // Mutation to reschedule an appointment
  const { mutate: rescheduleToken, isPending: isRescheduling } = useMutation({
    mutationFn: async (payload: {tokenId: string, time: string}): Promise<any> => {
      const { data } = await api.patch(`/api/queue/reschedule/${payload.tokenId}`, { new_time: new Date(payload.time).toISOString() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tokens'] });
      setRescheduleData({open: false, tokenId: '', time: ''});
      setToast({open: true, msg: 'Appointment Rescheduled Successfully', type: 'success'});
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setToast({open: true, msg: err.response?.data?.message || 'Error rescheduling', type: 'error'});
    }
  });

  const handleRescheduleSubmit = () => {
    if(rescheduleData.time && rescheduleData.tokenId) rescheduleToken({tokenId: rescheduleData.tokenId, time: rescheduleData.time});
  };

  // Filter tokens into Active and History lists
  const activeTokens = tokens?.filter(tk => [QueueStatus.WAITING, QueueStatus.BOOKED, QueueStatus.ARRIVED].includes(tk.status)) || [];
  const pastTokens = tokens?.filter(tk => ![QueueStatus.WAITING, QueueStatus.BOOKED, QueueStatus.ARRIVED].includes(tk.status)) || [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: { xs: 3, md: 8 } }}>
      <Container maxWidth="md">
        {/* Header row with language toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>{t('myCitizenDash')}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.85rem', sm: '1rem' } }}>{t('manageAppointments')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <LanguageToggle />
            <Button variant="contained" color="primary" startIcon={<AddCircleOutlined />} onClick={() => navigate('/portal')} sx={{ fontWeight: 700, borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('newBooking')}
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<LogoutOutlined />} onClick={() => { logout(); navigate('/'); }} sx={{ fontWeight: 700, borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('logout')}
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4 }}>

        {isLoading ? <CircularProgress /> : (
          <Stack spacing={6}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#2563eb', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{t('activeBookings')}</Typography>
              <Grid container spacing={3}>
                {activeTokens.length === 0 ? <Typography sx={{ pl: 3, color: '#94a3b8' }}>{t('noActiveBookings')}</Typography> : 
                activeTokens.map(tk => (
                  <Grid size={{xs: 12}} key={tk.id}>
                    <Card sx={{ 
                      p: { xs: 2.5, sm: 4 }, 
                      borderRadius: 4, 
                      border: 'none', 
                      bgcolor: '#ffffff',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                        <Box>
                          <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1 }}>{t('tokenNumber')}</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', lineHeight: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{tk.token_number}</Typography>
                          <Chip label={tk.status.replace('_', ' ')} color="primary" size="small" sx={{ mt: 1.5, fontWeight: 700 }} />
                        </Box>
                        <Button variant="contained" color="primary" onClick={() => navigate(`/track/${tk.token_number}`)} sx={{ borderRadius: 2, fontWeight: 700, px: 3, width: { xs: '100%', sm: 'auto' } }}>{t('liveTrack')}</Button>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 4 }} sx={{ color: '#475569', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocationOn color="primary"/> <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}>{tk.branch?.name}</Typography></Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Event color="primary"/> <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}>{new Date(tk.expected_service_time!).toLocaleString()}</Typography></Box>
                      </Stack>
                      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button variant="outlined" color="primary" onClick={() => setRescheduleData({open: true, tokenId: tk.id!, time: ''})} sx={{ fontWeight: 700, borderRadius: 2 }}>{t('reschedule')}</Button>
                        <Button variant="text" color="error" onClick={() => cancelToken(tk.id!)} disabled={isCanceling} sx={{ fontWeight: 700 }}>{t('cancelBooking')}</Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#64748b', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{t('history')}</Typography>
              <Grid container spacing={3}>
                {pastTokens.length === 0 ? <Typography sx={{ pl: 3, color: '#94a3b8' }}>{t('noPastHistory')}</Typography> : 
                pastTokens.map(tk => (
                  <Grid size={{xs: 12}} key={tk.id}>
                    <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '0.85rem', sm: '1rem' } }}>{tk.token_number} <Typography component="span" sx={{ color: '#94a3b8', mx: 1 }}>|</Typography> {tk.service?.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{new Date(tk.created_at).toLocaleDateString()}</Typography>
                      </Box>
                      <Chip label={tk.status} size="small" color={tk.status === 'COMPLETED' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        )}
        </Box>
      </Container>

      <Dialog open={rescheduleData.open} onClose={() => setRescheduleData({open: false, tokenId: '', time: ''})} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('rescheduleAppt')}</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <TextField 
            fullWidth 
            type="datetime-local" 
            label={t('newTime')}
            slotProps={{ inputLabel: { shrink: true } }}
            value={rescheduleData.time}
            onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRescheduleData({open: false, tokenId: '', time: ''})}>{t('close')}</Button>
          <Button variant="contained" color="primary" onClick={handleRescheduleSubmit} disabled={isRescheduling || !rescheduleData.time}>{t('confirmReschedule')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.type} variant="filled">{toast.msg}</Alert>
      </Snackbar>

      {/* AI Assistant available globally for citizens */}
      <AIChatWidget />
    </Box>
  );
};
