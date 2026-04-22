// @ts-nocheck
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Rating, TextField, Snackbar } from '@mui/material';
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#1e1e1e' }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#1e1e1e', p: 2 }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400, fontWeight: 'bold' }}>
          Invalid Token or Token Not Found.
        </Alert>
      </Box>
    );
  }

  const { token, people_ahead } = data;
  const isCalled = token.status === QueueStatus.CALLED;
  const isCompleted = token.status === QueueStatus.COMPLETED;
  const isWaitingOrArrived = [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED].includes(token.status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: isCalled ? '#4caf50' : '#121212', color: '#ffffff', p: 3, transition: 'background-color 0.5s ease' }}>
      <Card sx={{ maxWidth: 500, width: '100%', bgcolor: isCalled ? '#ffffff' : '#1e1e1e', color: isCalled ? '#000000' : '#ffffff', boxShadow: 6, borderRadius: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {isCalled ? (
            <Box sx={{ mb: 4, p: 3, border: "4px solid #4caf50", borderRadius: 2, bgcolor: "#e8f5e9" }}>
              <Typography variant="h3" className="blink-text" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                PLEASE PROCEED TO DESK {token.desk_number || ''}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#aaaaaa', fontWeight: 'bold' }}>
                Your Token Number
              </Typography>
              <Typography variant="h1" sx={{ fontWeight: 'bold', color: token.priority === 1 ? "error.light" : "primary.light" }}>
                {token.token_number}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 2, bgcolor: isCalled ? '#f5f5f5' : '#2d2d2d', borderRadius: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: isCalled ? 'text.secondary' : '#aaaaaa', fontWeight: 'bold' }}>
                Current Status
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {token.status.replace('_', ' ')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: isCalled ? 'text.secondary' : '#aaaaaa', fontWeight: 'bold' }}>
                People Ahead
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: isCalled ? 'text.primary' : 'error.light' }}>
                {people_ahead}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, mb: 3, border: "1px dashed", borderColor: isCalled ? 'grey.400' : 'grey.700', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: isCalled ? 'text.secondary' : '#aaaaaa', fontWeight: 'bold' }}>
              Estimated Service Time
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: isCalled ? 'text.primary' : 'info.light' }}>
              {new Date(token.expected_service_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>

          {isWaitingOrArrived && (
            <Button 
              variant="outlined" 
              color="warning" 
              fullWidth 
              onClick={() => setDelayOpen(true)}
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              Running Late? Report Delay
            </Button>
          )}

          {isCompleted && !token.rating && (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={() => setFeedbackOpen(true)}
              sx={{ fontWeight: 'bold' }}
            >
              Rate Your Experience
            </Button>
          )}
          
          {isCompleted && token.rating && (
            <Alert severity="success" sx={{ mt: 2, justifyContent: 'center' }}>
              You rated your experience {token.rating} Stars!
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Rate Your Experience</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <Typography sx={{ mb: 2 }}>How was the service today?</Typography>
          <Rating
            name="service-rating"
            value={rating}
            onChange={(_, newValue) => {
              setRating(newValue);
            }}
            size="large"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setFeedbackOpen(false)} disabled={feedbackPending}>Cancel</Button>
          <Button variant="contained" onClick={() => submitFeedback()} disabled={feedbackPending || !rating}>
            {feedbackPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delay Dialog */}
      <Dialog open={delayOpen} onClose={() => setDelayOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Report Delay</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <Typography sx={{ mb: 2 }} align="center">
            Are you running late? Report a delay to push back your expected service time without losing your spot.
          </Typography>
          <TextField
            type="number"
            label="Delay in Minutes"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1, max: 120 } }}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setDelayOpen(false)} disabled={delayPending}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => reportDelay()} disabled={delayPending || delayMinutes <= 0}>
            {delayPending ? 'Reporting...' : 'Confirm Delay'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbarMsg} autoHideDuration={4000} onClose={() => setSnackbarMsg('')}>
        <Alert onClose={() => setSnackbarMsg('')} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          .blink-text {
            animation: blink 1.5s infinite;
          }
        `}
      </style>
    </Box>
  );
};
