// @ts-nocheck
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Skeleton, Snackbar, Alert, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { useLiveQueue, useAdvanceToken, useBranches, useServices } from '../hooks/useQueue';
import { QueueStatus, Token } from '../types';

export const StaffDashboard: React.FC<{ isOffline?: boolean }> = ({ isOffline = false }) => {
  const queryClient = useQueryClient();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: services, isLoading: servicesLoading } = useServices();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // Set default branch when loaded
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const { data: queue, isLoading, isError, error } = useLiveQueue(selectedBranchId, !isOffline && !!selectedBranchId);
  const { mutate: advanceToken, isPending } = useAdvanceToken(selectedBranchId);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastAction, setLastAction] = useState<{ tokenId: string; oldStatus: QueueStatus } | null>(null);

  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInName, setWalkInName] = useState('Walk-in Citizen');
  const [walkInService, setWalkInService] = useState('');
  const [walkInError, setWalkInError] = useState('');

  const { mutate: registerWalkIn, isPending: isRegistering } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/queue/walk-in', {
        phone: walkInPhone || '0000000000',
        name: walkInName || 'Walk-in Citizen',
        service_id: walkInService || undefined,
        branch_id: selectedBranchId || undefined
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setWalkInModalOpen(false);
      setSnackbarMessage('Walk-in registered successfully!');
      setSnackbarOpen(true);
      setWalkInPhone('');
      setWalkInName('Walk-in Citizen');
      setWalkInService('');
    },
    onError: (error: any) => {
      setWalkInError(error.response?.data?.message || 'Failed to register walk-in');
      console.error("Walk-in error:", error);
    }
  });

  const handleAction = (token: Token, newStatus: QueueStatus) => {
    setLastAction({ tokenId: token.id!, oldStatus: token.status });
    advanceToken(
      { tokenId: token.id!, newStatus },
      {
        onSuccess: () => {
          setSnackbarMessage(`Status updated successfully.`);
          setSnackbarOpen(true);
        },
      }
    );
  };

  const handleUndo = () => {
    if (lastAction) {
      advanceToken(
        { tokenId: lastAction.tokenId, newStatus: lastAction.oldStatus },
        {
          onSuccess: () => {
            setSnackbarMessage('Action undone successfully');
            setLastAction(null);
          },
        }
      );
    }
  };

  const renderActionButtons = (token: Token) => {
    const btnSx = { minHeight: '44px', minWidth: '44px', mr: 1, mb: 1, fontWeight: 'bold' };

    switch (token.status) {
      case QueueStatus.BOOKED:
        return (
          <Button variant="contained" color="info" sx={btnSx} onClick={() => handleAction(token, QueueStatus.ARRIVED)} disabled={isPending}>
            Mark Arrived
          </Button>
        );
      case QueueStatus.ARRIVED:
      case QueueStatus.WAITING:
      case QueueStatus.RETURN_LATER:
        return (
          <Button variant="contained" color="primary" sx={btnSx} onClick={() => handleAction(token, QueueStatus.CALLED)} disabled={isPending}>
            Call Next
          </Button>
        );
      case QueueStatus.CALLED:
        return (
          <>
            <Button variant="contained" color="success" sx={btnSx} onClick={() => handleAction(token, QueueStatus.IN_PROGRESS)} disabled={isPending}>
              Start Service
            </Button>
            <Button variant="outlined" color="error" sx={btnSx} onClick={() => handleAction(token, QueueStatus.NO_SHOW)} disabled={isPending}>
              Mark No-Show
            </Button>
          </>
        );
      case QueueStatus.IN_PROGRESS:
        return (
          <>
            <Button variant="contained" color="secondary" sx={btnSx} onClick={() => handleAction(token, QueueStatus.COMPLETED)} disabled={isPending}>
              Complete
            </Button>
            <Button variant="outlined" color="warning" sx={btnSx} onClick={() => handleAction(token, QueueStatus.RETURN_LATER)} disabled={isPending}>
              Return Later
            </Button>
          </>
        );
      case QueueStatus.NO_SHOW:
        return (
          <Button variant="contained" color="warning" sx={btnSx} onClick={() => handleAction(token, QueueStatus.WAITING)} disabled={isPending}>
            Mark Late Arrival
          </Button>
        );
      default:
        return null;
    }
  };

  if (branchesLoading) {
    return <Box p={3}><CircularProgress /></Box>;
  }

  return (
    <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Staff Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranchId} label="Branch" onChange={(e) => setSelectedBranchId(e.target.value)}>
              {branches?.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" color="secondary" onClick={() => setWalkInModalOpen(true)}>
            + Walk-in
          </Button>
        </Box>
      </Box>

      {branches?.find(b => b.id === selectedBranchId)?.rush_mode && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, fontWeight: 'bold' }}>
          RUSH PROTOCOL ACTIVE. New walk-ins should be discouraged.
        </Alert>
      )}

      <section aria-live="polite" aria-atomic="true">
        {isLoading || !selectedBranchId ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Card key={i} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={30} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" width={100} height={44} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : isError ? (
          <Alert severity="error">{(error as Error).message}</Alert>
        ) : queue?.length === 0 ? (
          <Alert severity="info" sx={{ fontWeight: 'bold' }}>No active tokens in the queue for this branch.</Alert>
        ) : (
          queue?.map((token) => (
            <article key={token.id}>
              <Card sx={{ mb: 2, borderLeft: `6px solid ${getColorForStatus(token.status)}`, boxShadow: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 auto', mb: { xs: 2, sm: 0 } }}>
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: token.priority === 1 ? 'error.main' : 'inherit' }}>
                        {token.token_number} {token.priority === 1 && '⭐ VIP'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        Status: <strong>{token.status}</strong> | Expected: {new Date(token.expected_service_time).toLocaleTimeString()}
                      </Typography>
                      {token.notes && <Typography variant="body2" color="warning.dark">Notes: {token.notes}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
                      {renderActionButtons(token)}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </article>
          ))
        )}
      </section>

      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', alignItems: 'center', fontWeight: 'bold' }}
          action={lastAction ? <Button color="inherit" size="small" onClick={handleUndo}>UNDO</Button> : null}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={walkInModalOpen} onClose={() => setWalkInModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register Walk-in</DialogTitle>
        <DialogContent>
          {walkInError && <Alert severity="error" sx={{ mb: 2 }}>{walkInError}</Alert>}
          <TextField fullWidth margin="normal" label="Citizen Name" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} disabled={isRegistering} />
          <TextField fullWidth margin="normal" label="Phone Number (or 0000000000)" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} disabled={isRegistering} />
          <TextField select fullWidth margin="normal" label="Select Service" value={walkInService} onChange={(e) => setWalkInService(e.target.value)} disabled={isRegistering || servicesLoading}>
            {!servicesLoading && services?.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name} ({s.base_duration_minutes}m)</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWalkInModalOpen(false)} disabled={isRegistering}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => registerWalkIn()} disabled={isRegistering}>
            {isRegistering ? 'Registering...' : 'Register & Print Token'}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

import { CircularProgress } from '@mui/material';
function getColorForStatus(status: QueueStatus) {
  switch (status) {
    case QueueStatus.WAITING: return '#1976d2';
    case QueueStatus.CALLED: return '#2e7d32';
    case QueueStatus.IN_PROGRESS: return '#9c27b0';
    case QueueStatus.RETURN_LATER: return '#ed6c02';
    case QueueStatus.NO_SHOW: return '#d32f2f';
    default: return '#e0e0e0';
  }
}
