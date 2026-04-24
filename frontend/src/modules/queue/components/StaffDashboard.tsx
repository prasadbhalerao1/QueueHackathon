import React, { useState, useRef, useMemo } from 'react';
import {
  Box, Card, Typography, Button, Skeleton, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Chip,
  Paper, Grid, IconButton, Tooltip, Stack, Badge, Switch, FormControlLabel
} from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { 
  useLiveQueue, useAdvanceToken, useBranches, useServices, 
  useTransferToken, useToggleRush, useUndoAction, usePauseDesk
} from '../hooks/useQueue';
import { QueueStatus, Token } from '../types';
import {
  Undo as UndoIcon,
  RecordVoiceOver as CallIcon,
  PlayArrow as StartIcon,
  CheckCircle as DoneIcon,
  Close as NoShowIcon,
  CompareArrows as TransferIcon,
  Warning as RushIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  DesktopWindows as DeskIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../common/components/LanguageToggle';

export const StaffDashboard: React.FC<{ isOffline?: boolean }> = ({ isOffline = false }) => {
  const { t } = useTranslation();
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
  const { mutate: transferToken } = useTransferToken(selectedBranchId);
  const { mutate: toggleRush } = useToggleRush(selectedBranchId);
  const { mutate: undoAction } = useUndoAction(selectedBranchId);
  const { mutate: pauseDesk } = usePauseDesk(selectedBranchId);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Undo State
  const [lastActionTokenId, setLastActionTokenId] = useState<string | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({ phone: '', name: 'Walk-in Citizen', serviceId: '' });

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTokenData, setTransferTokenData] = useState<Token | null>(null);
  const [targetBranchId, setTargetBranchId] = useState('');
  
  // Multi-staff: Desk Assignment
  const [deskNumber, setDeskNumber] = useState<string>(localStorage.getItem('staff_desk') || '1');
  
  const updateDesk = (val: string) => {
    setDeskNumber(val);
    localStorage.setItem('staff_desk', val);
  };

  // Availability Toggle
  const userId = localStorage.getItem('user_id');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const { mutate: toggleAvailability } = useMutation({
    mutationFn: async (available: boolean) => {
      if (!userId) throw new Error("No user ID found");
      const { data } = await api.patch(`/api/users/${userId}/availability`, { is_available: available });
      return data;
    },
    onSuccess: (data) => {
      setSnackbarMessage(`Status updated to: ${data.is_available ? 'Available' : 'Unavailable'}`);
      setSnackbarOpen(true);
    }
  });

  const handleAvailabilityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAvailable(checked);
    toggleAvailability(checked);
  };

  // Filtering Queue
  const servingQueue = useMemo(() => 
    queue?.filter(tk => (tk.status === QueueStatus.CALLED || tk.status === QueueStatus.IN_PROGRESS) && tk.desk_number === parseInt(deskNumber)) || []
  , [queue, deskNumber]);

  const waitingQueue = useMemo(() => 
    queue?.filter(tk => tk.status === QueueStatus.WAITING || tk.status === QueueStatus.ARRIVED || tk.status === QueueStatus.BOOKED || tk.status === QueueStatus.NO_SHOW) || []
  , [queue]);

  const nextUp = useMemo(() => 
    waitingQueue.filter(tk => tk.status !== QueueStatus.NO_SHOW)[0] || null
  , [waitingQueue]);

  const currentBranch = useMemo(() => 
    branches?.find(b => b.id === selectedBranchId)
  , [branches, selectedBranchId]);

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
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setLastActionTokenId(token.id);
    
    advanceToken({ tokenId: token.id!, newStatus, deskNumber: parseInt(deskNumber) }, {
      onSuccess: () => {
        setSnackbarMessage(`Token ${token.token_number} updated to ${newStatus.replace('_', ' ')}`);
        setSnackbarOpen(true);
        undoTimeoutRef.current = setTimeout(() => setLastActionTokenId(null), 10000);
      },
    });
  };

  const handleUndo = () => {
    if (lastActionTokenId) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoAction(lastActionTokenId, {
        onSuccess: () => {
          setSnackbarMessage(`Action undone successfully.`);
          setSnackbarOpen(true);
          setLastActionTokenId(null);
        }
      });
    }
  };

  const handlePauseDesk = () => {
    if (window.confirm(`Are you sure you want to pause Desk ${deskNumber}? All active tokens at this desk will be returned to the waiting pool.`)) {
      pauseDesk(parseInt(deskNumber), {
        onSuccess: () => {
          setSnackbarMessage(`Desk ${deskNumber} paused. Go take a break!`);
          setSnackbarOpen(true);
        }
      });
    }
  };

  const handleTransfer = () => {
    if (transferTokenData && targetBranchId) {
      transferToken({ tokenId: transferTokenData.id!, targetBranchId }, {
        onSuccess: () => {
          setSnackbarMessage(`Token ${transferTokenData.token_number} transferred to ${branches?.find(b => b.id === targetBranchId)?.name}`);
          setSnackbarOpen(true);
          setTransferModalOpen(false);
          setTransferTokenData(null);
          setTargetBranchId('');
        },
        onError: (error) => {
          setSnackbarMessage(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setSnackbarOpen(true);
        }
      });
    }
  };

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING: return '#f59e0b';
      case QueueStatus.CALLED: return '#3b82f6';
      case QueueStatus.IN_PROGRESS: return '#10b981';
      case QueueStatus.NO_SHOW: return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <Box sx={{ maxWidth: '1600px', mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Language + Network / Rush Alerts */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <LanguageToggle />
      </Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        {isOffline && (
          <Alert severity="warning" variant="filled" sx={{ fontWeight: 'bold', borderRadius: 2 }}>
            {t('offlineMode')}
          </Alert>
        )}
        {currentBranch?.rush_mode && (
          <Alert severity="error" variant="filled" icon={<RushIcon />} sx={{ fontWeight: 'bold', borderRadius: 2 }}>
            {t('rushProtocolActive')}
          </Alert>
        )}
      </Stack>

      {/* Control Center */}
      <Paper elevation={0} sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', mb: 4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 4, gap: 3, bgcolor: '#ffffff', borderBottom: '4px solid #1e3a8a' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1.5px', color: '#1e3a8a' }}>{t('operationalCommand')}</Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <Select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#f1f5f9' }}
                  aria-label="Select Branch"
                >
                  {branches?.map(b => <MenuItem key={b.id} value={b.id} sx={{ fontWeight: 600 }}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel sx={{ fontWeight: 700 }}>{t('deskLabel')}</InputLabel>
                <Select 
                  value={deskNumber} 
                  label={t('deskLabel')} 
                  onChange={(e) => updateDesk(e.target.value as string)}
                  sx={{ borderRadius: 2, fontWeight: 800, bgcolor: '#f1f5f9' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <MenuItem key={n} value={n.toString()} sx={{ fontWeight: 700 }}>Desk {n}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Chip 
                icon={<PersonIcon />} 
                label={t('citizensActive', { count: queue?.length || 0 })} 
                sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, px: 1 }} 
              />
              
              <FormControlLabel
                control={<Switch checked={isAvailable} onChange={handleAvailabilityToggle} color="primary" />}
                label={<Typography sx={{ fontWeight: 700 }}>{t('available')}</Typography>}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Tooltip title="Enable Rush Protocol (Global Block)">
              <Button 
                variant={currentBranch?.rush_mode ? "contained" : "outlined"} 
                color="error" 
                aria-label="Toggle Rush Protocol"
                startIcon={<RushIcon />}
                onClick={() => toggleRush()}
                sx={{ borderRadius: 2, fontWeight: 800, px: 3, height: 48 }}
              >
                {currentBranch?.rush_mode ? t('liftRush') : t('rushMode')}
              </Button>
            </Tooltip>
            <Tooltip title="Pause Desk (Return tokens to pool)">
              <Button 
                variant="outlined" 
                color="info" 
                aria-label="Pause My Desk"
                startIcon={<TimeIcon />}
                onClick={handlePauseDesk}
                sx={{ borderRadius: 2, fontWeight: 800, px: 3, height: 48, mr: 2 }}
              >
                {t('pauseDesk')}
              </Button>
            </Tooltip>
            <Button 
              variant="contained" 
              color="secondary" 
              aria-label="Register Walk-In"
              startIcon={<AddIcon />}
              onClick={() => setWalkInModalOpen(true)}
              disabled={!!currentBranch?.rush_mode}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3, height: 48, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' } }}
            >
              {currentBranch?.rush_mode ? t('locked') : t('walkIn')}
            </Button>
            <Button 
              variant="contained" 
              aria-label="Call Next Citizen in Queue"
              disabled={!nextUp}
              startIcon={<CallIcon />}
              onClick={() => nextUp && handleAction(nextUp, QueueStatus.CALLED)}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 900, 
                px: 4, 
                height: 56,
                fontSize: '1.1rem', 
                bgcolor: '#2563eb',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              {t('callNext')}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: ACTIVE SERVING */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ borderRight: { lg: '1px solid #e2e8f0' }, pr: { lg: 4 } }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{t('currentlyAtDesks')}</Typography>
            <Badge badgeContent={servingQueue.length} color="primary" sx={{ ml: 1 }} />
          </Box>
          <Stack spacing={2}>
            {servingQueue.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '2px dashed #cbd5e1', bgcolor: 'transparent' }}>
                <Typography color="text.secondary">{t('noCitizensServed')}</Typography>
              </Paper>
            ) : (
              servingQueue.map(token => (
                <Card key={token.id} sx={{ p: 0, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: getStatusColor(token.status), color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{token.token_number}</Typography>
                    <Chip label={token.status} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800 }} />
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                      <DeskIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('servingAtDesk', { desk: deskNumber })}</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b', mb: 0.5 }}>{token.user?.name || 'Anonymous'}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#3b82f6', mb: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>{token.service?.name}</Typography>
                    
                    <Stack spacing={2}>
                      {token.status === QueueStatus.CALLED && (
                        <Button fullWidth variant="contained" color="success" aria-label="Start serving this citizen" startIcon={<StartIcon />} onClick={() => handleAction(token, QueueStatus.IN_PROGRESS)} sx={{ fontWeight: 900, height: 48, borderRadius: 2 }}>
                          {t('startService')}
                        </Button>
                      )}
                      {token.status === QueueStatus.IN_PROGRESS && (
                        <Button fullWidth variant="contained" color="primary" aria-label="Complete service for this citizen" startIcon={<DoneIcon />} onClick={() => handleAction(token, QueueStatus.COMPLETED)} sx={{ fontWeight: 900, height: 48, borderRadius: 2, bgcolor: '#1e3a8a' }}>
                          {t('complete')}
                        </Button>
                      )}
                      <Button fullWidth variant="outlined" color="error" aria-label="Mark citizen as not present" startIcon={<NoShowIcon />} onClick={() => handleAction(token, QueueStatus.NO_SHOW)} sx={{ fontWeight: 800, borderRadius: 2 }}>
                        {t('notPresent')}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              ))
            )}
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: WAITING QUEUE */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ pl: { lg: 2 } }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{t('waitingList')}</Typography>
            <Badge badgeContent={waitingQueue.length} color="warning" sx={{ ml: 1 }} />
          </Box>
          <Grid container spacing={2}>
            {isLoading ? (
              [1,2,3,4,5,6].map(i => (
                <Grid size={{ xs: 12, md: 6 }} key={i}>
                  <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
                </Grid>
              ))
            ) : waitingQueue.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#64748b' }}>{t('queueClear')}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{t('allProcessed')}</Typography>
                </Paper>
              </Grid>
            ) : (
              waitingQueue.map(token => (
                <Grid size={{ xs: 12, md: 6 }} key={token.id} sx={{ display: 'flex' }}>
                  <Card sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    border: '1px solid #e2e8f0', 
                    display: 'flex', 
                    flexDirection: 'column',
                    flexGrow: 1,
                    minHeight: 180,
                    position: 'relative',
                    transition: 'transform 0.1s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                  }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>{token.token_number}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{token.user?.name || 'Walk-in'}</Typography>
                        </Box>
                        <Chip label={token.status.replace('_', ' ')} size="small" sx={{ bgcolor: getStatusColor(token.status) + '22', color: getStatusColor(token.status), fontWeight: 800, border: `1px solid ${getStatusColor(token.status)}` }} />
                      </Box>

                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {token.expected_service_time 
                              ? new Date(token.expected_service_time + (token.expected_service_time.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '--:--'}
                          </Typography>
                      
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{new Date(token.expected_service_time + (token.expected_service_time.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>{token.service?.name}</Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {token.status === QueueStatus.NO_SHOW ? (
                        <Button fullWidth variant="contained" color="warning" size="small" onClick={() => handleAction(token, QueueStatus.WAITING)} sx={{ fontWeight: 800 }}>
                          {t('graceReentry')}
                        </Button>
                      ) : (
                        <>
                          {(token.status === QueueStatus.BOOKED || token.status === QueueStatus.WAITING) && (
                            <Button fullWidth variant="outlined" color="success" size="small" onClick={() => handleAction(token, QueueStatus.ARRIVED)} sx={{ fontWeight: 800 }}>
                              {t('arrived')}
                            </Button>
                          )}
                          <Button fullWidth variant="contained" color="primary" size="small" onClick={() => handleAction(token, QueueStatus.CALLED)} sx={{ fontWeight: 800 }}>
                            {t('call')}
                          </Button>
                        </>
                      )}
                      <Tooltip title="Transfer to another branch">
                        <IconButton size="small" color="inherit" onClick={() => { setTransferTokenData(token); setTransferModalOpen(true); }} sx={{ border: '1px solid #e2e8f0' }}>
                          <TransferIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* DIALOGS */}
      
      {/* Walk-in Dialog */}
      <Dialog open={walkInModalOpen} onClose={() => setWalkInModalOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: '100%', maxWidth: 450 } } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{t('registerWalkIn')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label={t('citizenName')} variant="outlined" value={walkInData.name} onChange={e => setWalkInData({...walkInData, name: e.target.value})} />
            <TextField fullWidth label={t('phoneContact')} variant="outlined" value={walkInData.phone} onChange={e => setWalkInData({...walkInData, phone: e.target.value})} />
            <FormControl fullWidth>
              <InputLabel>{t('targetService')}</InputLabel>
              <Select value={walkInData.serviceId} label={t('targetService')} onChange={e => setWalkInData({...walkInData, serviceId: e.target.value})}>
                {services?.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setWalkInModalOpen(false)} color="inherit">{t('cancel')}</Button>
          <Button variant="contained" onClick={() => registerWalkIn()} disabled={!walkInData.serviceId} sx={{ fontWeight: 800 }}>{t('confirmBooking')}</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: '100%', maxWidth: 450 } } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{t('transferToken', { token: transferTokenData?.token_number })}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{t('transferDesc')}</Typography>
          <FormControl fullWidth>
            <InputLabel>{t('targetBranch')}</InputLabel>
            <Select value={targetBranchId} label={t('targetBranch')} onChange={e => setTargetBranchId(e.target.value)}>
              {branches?.filter(b => b.id !== selectedBranchId).map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTransferModalOpen(false)} color="inherit">{t('cancel')}</Button>
          <Button variant="contained" color="warning" onClick={handleTransfer} disabled={!targetBranchId} sx={{ fontWeight: 800 }}>{t('completeTransfer')}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled" 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 800 }}
          action={lastActionTokenId && (
            <Button color="inherit" size="small" onClick={handleUndo} startIcon={<UndoIcon />} sx={{ fontWeight: 900 }}>UNDO</Button>
          )}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
