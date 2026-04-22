import React, { useState, useRef } from 'react';
import {
  Box, Card, Typography, Button, Skeleton, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Paper, Grid
} from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { useLiveQueue, useAdvanceToken, useBranches, useServices } from '../hooks/useQueue';
import { QueueStatus, Token } from '../types';
import UndoIcon from '@mui/icons-material/Undo';

export const StaffDashboard: React.FC<{ isOffline?: boolean }> = ({ isOffline = false }) => {
  const queryClient = useQueryClient();
  const { data: branches } = useBranches();
  const { data: services } = useServices();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const { data: queue, isLoading } = useLiveQueue(selectedBranchId, !isOffline && !!selectedBranchId);
  const { mutate: advanceToken } = useAdvanceToken(selectedBranchId);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Undo State
  const [lastAction, setLastAction] = useState<{ token: Token, prevStatus: QueueStatus, newStatus: QueueStatus } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({ phone: '', name: 'Walk-in Citizen', serviceId: '' });

  const { mutate: registerWalkIn } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/queue/walk-in', {
        phone: walkInData.phone || '0000000000',
        name: walkInData.name || 'Walk-in Citizen',
        service_id: walkInData.serviceId || undefined,
        branch_id: selectedBranchId || undefined
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', selectedBranchId] });
      setWalkInModalOpen(false);
      setSnackbarMessage('Walk-in perfectly registered!');
      setSnackbarOpen(true);
      setWalkInData({ phone: '', name: 'Walk-in Citizen', serviceId: '' });
    }
  });

  const handleAction = (token: Token, newStatus: QueueStatus) => {
    // Clear previous undo timeout
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    
    setLastAction({ token, prevStatus: token.status, newStatus });
    
    advanceToken({ tokenId: token.id!, newStatus }, {
      onSuccess: () => {
        setSnackbarMessage(`Token ${token.token_number} updated to ${newStatus.replace('_', ' ')}`);
        setSnackbarOpen(true);
        
        // Hide undo button after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
          setLastAction(null);
        }, 5000);
      },
    });
  };

  const handleUndo = () => {
    if (lastAction) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      advanceToken({ tokenId: lastAction.token.id!, newStatus: lastAction.prevStatus }, {
        onSuccess: () => {
          setSnackbarMessage(`Undid action. ${lastAction.token.token_number} reverted to ${lastAction.prevStatus.replace('_', ' ')}`);
          setSnackbarOpen(true);
          setLastAction(null);
        }
      });
    }
  };

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING: return 'warning';
      case QueueStatus.CALLED: return 'info';
      case QueueStatus.IN_PROGRESS: return 'success';
      case QueueStatus.NO_SHOW: return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: { xs: 2, md: 4 } }}>
      
      {/* Offline Alert */}
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 3, fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2 }}>
          NETWORK DISCONNECTED: You are in Offline Mode. Keep working; all actions will be saved and synced automatically when internet returns.
        </Alert>
      )}

      {/* Header Controls */}
      <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} role="region">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, bgcolor: '#0f172a', color: 'white', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>Staff Operations</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Manage your desk and branch queue efficiently.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
             <FormControl sx={{ minWidth: 250, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
               <Select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  size="small"
                  sx={{ color: 'white', fontWeight: 'bold', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                >
                 {branches?.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
               </Select>
             </FormControl>
            <Button variant="contained" color="secondary" onClick={() => setWalkInModalOpen(true)} sx={{ fontWeight: 'bold', px: 3, py: 1, borderRadius: 2 }}>
              + Walk-In
            </Button>
          </Box>
        </Box>
      </Card>

      <Typography variant="h5" sx={{ fontWeight: '800', mb: 3, color: '#1e293b' }}>Active Queue Pipeline</Typography>
      
      {isLoading ? (
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => (
             <Grid size={{ xs: 12, md: 6 }} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
             </Grid>
          ))}
        </Grid>
      ) : queue?.length === 0 ? (
         <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 4, border: '2px dashed #cbd5e1' }}>
           <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold' }}>Queue is entirely clear.</Typography>
           <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Great job! No pending tokens at this branch.</Typography>
         </Paper>
      ) : (
        <Grid container spacing={3}>
          {queue?.map((token) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={token.id}>
              <Card sx={{ 
                p: 0, 
                borderRadius: 4, 
                border: '1px solid #e2e8f0',
                borderTop: `6px solid ${getStatusColor(token.status) === 'warning' ? '#f59e0b' : getStatusColor(token.status) === 'success' ? '#10b981' : getStatusColor(token.status) === 'info' ? '#3b82f6' : '#ef4444'}`,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', height: '100%'
              }}>
                <Box sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
                      {token.token_number}
                    </Typography>
                    <Chip label={token.status.replace('_', ' ')} color={getStatusColor(token.status) as any} sx={{ fontWeight: 'bold', borderRadius: 2 }} />
                  </Box>
                  
                  <Box sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}>Citizen Info</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '600' }}>{token.user?.name || 'Anonymous'}</Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold', mt: 0.5 }}>{token.service?.name}</Typography>
                  </Box>
                </Box>
                
                {/* Action Area */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {token.status === QueueStatus.WAITING && (
                    <Button fullWidth variant="contained" color="primary" onClick={() => handleAction(token, QueueStatus.CALLED)} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Call Next
                    </Button>
                  )}
                  {token.status === QueueStatus.CALLED && (
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Button fullWidth variant="contained" color="success" onClick={() => handleAction(token, QueueStatus.IN_PROGRESS)} sx={{ py: 1.5, fontWeight: 'bold' }}>
                          Arrived
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Button fullWidth variant="contained" color="error" onClick={() => handleAction(token, QueueStatus.NO_SHOW)} sx={{ py: 1.5, fontWeight: 'bold' }}>
                          No-Show
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                  {token.status === QueueStatus.IN_PROGRESS && (
                    <Button fullWidth variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }} onClick={() => handleAction(token, QueueStatus.COMPLETED)}>
                      Complete Service
                    </Button>
                  )}
                  {token.status === QueueStatus.NO_SHOW && (
                    <Button fullWidth variant="outlined" color="warning" onClick={() => handleAction(token, QueueStatus.WAITING)} sx={{ py: 1.5, fontWeight: 'bold', borderWidth: 2 }}>
                      Grace Re-Entry
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Walk-in Dialog */}
      <Dialog open={walkInModalOpen} onClose={() => setWalkInModalOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: '900', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Register Walk-in Citizen</DialogTitle>
        <DialogContent sx={{ mt: 2, minWidth: { sm: 400 } }}>
           <TextField fullWidth label="Citizen Name" margin="dense" variant="outlined" value={walkInData.name} onChange={e => setWalkInData({...walkInData, name: e.target.value})} sx={{ mb: 2 }} />
           <TextField fullWidth label="Phone Contact (Optional)" margin="dense" variant="outlined" value={walkInData.phone} onChange={e => setWalkInData({...walkInData, phone: e.target.value})} sx={{ mb: 2 }} />
           <FormControl fullWidth margin="dense">
             <InputLabel id="service-select-label">Target Service</InputLabel>
             <Select labelId="service-select-label" value={walkInData.serviceId} label="Target Service" onChange={e => setWalkInData({...walkInData, serviceId: e.target.value})}>
               {services?.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
             </Select>
           </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setWalkInModalOpen(false)} sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => registerWalkIn()} disabled={!walkInData.serviceId} sx={{ fontWeight: 'bold', px: 3 }}>
            Generate Token
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar with Undo */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled" 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 'bold', alignItems: 'center' }}
          action={
            lastAction && (
              <Button color="inherit" size="small" onClick={handleUndo} startIcon={<UndoIcon />} sx={{ fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.5)' }}>
                UNDO
              </Button>
            )
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
