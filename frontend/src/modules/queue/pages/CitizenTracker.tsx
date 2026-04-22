// @ts-nocheck
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Rating, TextField, Snackbar, Container, Chip, LinearProgress } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/api';
import { QueueStatus } from '../types';

export const CitizenTracker: React.FC = () => {
  const { tokenNumber } = useParams<{ tokenNumber: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['track', tokenNumber],
    queryFn: async () => {
      const response = await api.get(`/api/queue/track/${tokenNumber}`);
      return response.data.data;
    },
    refetchInterval: 3000,
  });

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(0);
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const { mutate: submitFeedback, isPending: feedbackPending } = useMutation({
    mutationFn: async () => {
      if (!data?.token?.id) throw new Error("No token ID");
      await api.post(`/api/queue/feedback/${data.token.id}`, { rating });
    },
    onSuccess: () => {
      setSnackbarMsg("Feedback submitted successfully. Thank you!");
      setFeedbackOpen(false);
      queryClient.invalidateQueries({ queryKey: ['track', tokenNumber] });
    }
  });

  const { mutate: reportDelay, isPending: delayPending } = useMutation({
    mutationFn: async () => {
      if (!data?.token?.id) throw new Error("No token ID");
      await api.post(`/api/queue/delay/${data.token.id}`, { delay_minutes: delayMinutes });
    },
    onSuccess: () => {
      setSnackbarMsg(`Delay of ${delayMinutes} mins reported. Your spot is held.`);
      setDelayOpen(false);
      queryClient.invalidateQueries({ queryKey: ['track', tokenNumber] });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={60} color="primary" thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold', color: 'text.secondary' }}>Loading Live Status...</Typography>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc', p: 2 }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400, fontWeight: 'bold', borderRadius: 3 }}>
          Invalid Token or Token Not Found.
        </Alert>
      </Box>
    );
  }

  const { token, people_ahead, estimated_wait_minutes, current_serving } = data;
  const isCalled = token.status === QueueStatus.CALLED;
  const isCompleted = token.status === QueueStatus.COMPLETED;
  const isWaitingOrArrived = [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED].includes(token.status);

  // Dynamic Progress Logic
  const initialEstimate = estimated_wait_minutes > 0 ? estimated_wait_minutes + (people_ahead * 10) : 60; // fallback scale
  const progressPercent = isCalled || isCompleted ? 100 : Math.max(5, 100 - ((people_ahead * 10 / initialEstimate) * 100));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: isCalled ? '#10b981' : '#f8fafc', 
      color: isCalled ? '#ffffff' : '#0f172a', 
      transition: 'background-color 0.5s ease',
      pb: 4
    }}>
      {/* Top Banner */}
      <Box sx={{ bgcolor: isCalled ? 'rgba(0,0,0,0.2)' : '#ffffff', p: 2, boxShadow: isCalled ? 'none' : '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="900" sx={{ opacity: 0.9 }}>QueueOS Track</Typography>
        {token.branch?.name && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>{token.branch.name}</Typography>
        )}
      </Box>

      <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Token Card */}
        <Card elevation={isCalled ? 0 : 4} sx={{ 
          borderRadius: 4, 
          bgcolor: isCalled ? 'rgba(255,255,255,0.95)' : '#ffffff', 
          color: '#0f172a',
          mb: 4,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isCalled && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', bgcolor: '#10b981' }} />
          )}
          
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
              YOUR TOKEN NUMBER
            </Typography>
            
            <Typography variant="h1" fontWeight="900" sx={{ 
              fontSize: { xs: '4rem', md: '5rem' }, 
              lineHeight: 1, 
              mb: 2, 
              color: isCalled ? '#10b981' : 'primary.main' 
            }}>
              {token.token_number}
            </Typography>

            <Chip 
              label={token.status.replace('_', ' ')} 
              color={isCalled ? "success" : "primary"} 
              variant={isCalled ? "filled" : "outlined"}
              sx={{ fontWeight: 'bold', fontSize: '1rem', px: 2, py: 2.5, borderRadius: 2 }}
            />
          </Box>

          {isCalled ? (
            <Box sx={{ p: 4, bgcolor: '#ecfdf5', borderTop: '1px solid #d1fae5', textAlign: 'center' }}>
               <Typography variant="h4" className="blink-text" sx={{ fontWeight: '900', color: '#047857' }}>
                IT'S YOUR TURN!
               </Typography>
               <Typography variant="h6" sx={{ mt: 1, color: '#065f46' }}>
                Please proceed to Desk {token.desk_number || 'immediately'}
               </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">Queue Progress</Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">{people_ahead} Ahead</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 5 }} />
              
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={3}>
                <Box p={2} bgcolor="#ffffff" borderRadius={3} textAlign="center" boxShadow="0 2px 4px rgba(0,0,0,0.02)">
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight="bold">Est. Wait</Typography>
                  <Typography variant="h5" fontWeight="900" color="info.main">{estimated_wait_minutes}m</Typography>
                </Box>
                <Box p={2} bgcolor="#ffffff" borderRadius={3} textAlign="center" boxShadow="0 2px 4px rgba(0,0,0,0.02)">
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight="bold">Serving</Typography>
                  <Typography variant="h5" fontWeight="900">{current_serving || '--'}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Card>

        {/* Action Buttons */}
        <Box display="flex" flexDirection="column" gap={2}>
          {isWaitingOrArrived && (
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              fullWidth 
              onClick={() => setDelayOpen(true)}
              sx={{ fontWeight: 'bold', py: 2, fontSize: '1.1rem', borderRadius: 3 }}
            >
              Running Late? (Hold Spot)
            </Button>
          )}

          {isCompleted && !token.rating && (
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              fullWidth 
              onClick={() => setFeedbackOpen(true)}
              sx={{ fontWeight: 'bold', py: 2, fontSize: '1.1rem', borderRadius: 3 }}
            >
              Rate Your Experience
            </Button>
          )}
          
          {isCompleted && token.rating && (
            <Alert severity="success" variant="filled" sx={{ borderRadius: 3, justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
              You rated your experience {token.rating} Stars. Thanks!
            </Alert>
          )}
        </Box>

      </Container>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: '900', textAlign: 'center', pb: 1 }}>How was our service?</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Rating
            name="service-rating"
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size="large"
            sx={{ fontSize: '3rem' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setFeedbackOpen(false)} disabled={feedbackPending} sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" onClick={() => submitFeedback()} disabled={feedbackPending || !rating} sx={{ fontWeight: 'bold', px: 4 }}>
            {feedbackPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delay Dialog */}
      <Dialog open={delayOpen} onClose={() => setDelayOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: '900', textAlign: 'center', pb: 1 }}>Report Delay</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Typography sx={{ mb: 3 }} align="center" color="text.secondary">
            Running late? We can push your slot back and let others go first so you don't lose your token.
          </Typography>
          <TextField
            type="number"
            label="I will be late by (minutes)"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1, max: 120 } }}
            fullWidth
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setDelayOpen(false)} disabled={delayPending} sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => reportDelay()} disabled={delayPending || delayMinutes <= 0} sx={{ fontWeight: 'bold', px: 4 }}>
            {delayPending ? 'Processing...' : 'Confirm Delay'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbarMsg} autoHideDuration={5000} onClose={() => setSnackbarMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarMsg('')} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 'bold' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1); }
          }
          .blink-text {
            animation: blink 2s infinite ease-in-out;
          }
        `}
      </style>
    </Box>
  );
};
