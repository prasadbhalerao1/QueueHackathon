import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, Button, Alert, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress, 
  Snackbar, Divider, Stack, IconButton, Tooltip, Paper, Skeleton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Backdrop
} from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { useAnalytics, useBranches } from '../../queue/hooks/useQueue';
import { StaffDashboard } from '../../queue/components/StaffDashboard';
import {
  Settings as SettingsIcon,
  Refresh as ResetIcon,
  History as AuditIcon,
  Business as BranchIcon,
  Assessment as StatsIcon,
  Warning as EmergencyIcon,
  Star as VipIcon,
  CheckCircle as DoneIcon
} from '@mui/icons-material';

// --- PREMIUM LOADER COMPONENT ---
const PremiumLoader: React.FC<{ open: boolean }> = ({ open }) => (
  <Backdrop
    sx={{ 
      color: '#fff', 
      zIndex: (theme) => theme.zIndex.drawer + 1000,
      bgcolor: 'rgba(15, 23, 42, 0.9)', // Slate-900 with transparency
      backdropFilter: 'blur(8px)'
    }}
    open={open}
  >
    <Stack sx={{ alignItems: 'center' }} spacing={3}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={80} thickness={2} sx={{ color: '#3b82f6' }} />
        <Box
          sx={{
            top: 0, left: 0, bottom: 0, right: 0,
            position: 'absolute', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <BranchIcon sx={{ fontSize: 32, color: 'white', animation: 'pulse 2s infinite' }} />
        </Box>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '2px', color: 'white' }}>
        PROCESSING SYSTEM REQUEST
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
        Synchronizing with secure government servers...
      </Typography>
    </Stack>
    <style>{`
      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.7; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.7; }
      }
    `}</style>
  </Backdrop>
);

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // Dialog States
  const [capacityDialogOpen, setCapacityDialogOpen] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number>(0);
  
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
      setNewCapacity(branches[0].total_desks || 5);
    }
  }, [branches, selectedBranchId]);

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(selectedBranchId, !!selectedBranchId);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { mutate: toggleRush, isPending: isTogglingRush } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/queue/rush/${selectedBranchId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setSnackbarMessage('Rush Protocol status updated');
    }
  });

  const { mutate: triggerVip, isPending: isTriggeringVip } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/queue/vip/${selectedBranchId}`);
      return data;
    },
    onSuccess: () => {
      setSnackbarMessage('VIP Override Successful: High-priority token generated');
      queryClient.invalidateQueries({ queryKey: ['queue', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
    }
  });

  const { mutate: resetQueue, isPending: isResetting } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/queue/admin/reset/${selectedBranchId}`);
      return data;
    },
    onSuccess: () => {
      setSnackbarMessage('EMERGENCY RESET: All branch tokens cleared.');
      queryClient.invalidateQueries({ queryKey: ['queue', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
    },
    onError: (error) => {
      setSnackbarMessage(`Reset failed: ${error.message || 'Unknown error'}`);
    }
  });

  const { mutate: updateCapacity, isPending: isUpdatingCapacity } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/api/queue/admin/branch/${selectedBranchId}/capacity`, null, {
        params: { capacity: newCapacity }
      });
      return data;
    },
    onSuccess: () => {
      setSnackbarMessage('Branch capacity successfully updated.');
      setCapacityDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    }
  });

  if (branchesLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  const isGlobalActionPending = isTogglingRush || isTriggeringVip || isResetting || isUpdatingCapacity;

  return (
    <Box sx={{ p: 4, maxWidth: "1600px", margin: "0 auto", bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Premium Global Loader */}
      <PremiumLoader open={isGlobalActionPending} />

      {/* Admin Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', mb: 1 }}>
            Admin Overdrive
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
            System-level control for branch performance and emergency protocols.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
           <FormControl sx={{ minWidth: 280, bgcolor: 'white', borderRadius: 2 }}>
            <InputLabel>Control Branch</InputLabel>
            <Select 
              value={selectedBranchId} 
              label="Control Branch" 
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                const b = branches?.find(b => b.id === e.target.value);
                if (b) setNewCapacity(b.total_desks || 5);
              }} 
              sx={{ borderRadius: 2 }}
            >
              {branches?.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh All Data">
            <IconButton onClick={() => queryClient.invalidateQueries()} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <ResetIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {[
          { label: 'Tokens Served', value: analytics?.tokens_served_today || 0, color: '#3b82f6', icon: <DoneIcon /> },
          { label: 'Live Waiting', value: analytics?.tokens_waiting || 0, color: '#f59e0b', icon: <AuditIcon /> },
          { label: 'Efficiency', value: `${analytics?.avg_wait_minutes || 0}m`, color: '#10b981', icon: <StatsIcon /> },
          { label: 'No-Show Rate', value: `${analytics?.no_show_percentage || 0}%`, color: '#ef4444', icon: <EmergencyIcon /> }
        ].map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ borderRadius: 4, borderLeft: `6px solid ${stat.color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="overline" sx={{ fontWeight: 800, color: stat.color }}>{stat.label}</Typography>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1 }}>{analyticsLoading ? <Skeleton /> : stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Left: Power Controls */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <Card sx={{ borderRadius: 4, p: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmergencyIcon color="error" /> Emergency Controls
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>RUSH PROTOCOL</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Locks the branch. Only allows pre-booked arrivals.</Typography>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color={analytics?.rush_mode ? "success" : "error"} 
                      onClick={() => toggleRush()}
                      sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
                    >
                      {analytics?.rush_mode ? "Lift Rush Protocol" : "Engage Rush Protocol"}
                    </Button>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>VIP OVERRIDE</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Injects a priority token at the head of the line.</Typography>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="warning" 
                      startIcon={<VipIcon />}
                      onClick={() => triggerVip()}
                      sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
                    >
                      Issue VIP Token
                    </Button>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#ef4444' }}>DANGER ZONE</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Immediately terminates all active and waiting tokens.</Typography>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="error" 
                      startIcon={<ResetIcon />}
                      onClick={() => window.confirm('Are you sure? This will delete all active tokens.') && resetQueue()}
                      sx={{ py: 1.5, fontWeight: 800, borderRadius: 2, border: '2px solid' }}
                    >
                      Emergency Reset Branch
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BranchIcon color="primary" /> Branch Settings
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Service Desks: {analytics?.total_desks || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Current capacity for {branches?.find(b => b.id === selectedBranchId)?.name}</Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    startIcon={<SettingsIcon />} 
                    onClick={() => setCapacityDialogOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Modify Capacity
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right: Operations Preview */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <Box sx={{ p: 2, bgcolor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800 }}>LIVE OPERATIONS PREVIEW</Typography>
              <Chip label="Staff View" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            </Box>
            <Box sx={{ p: 0, maxHeight: '800px', overflowY: 'auto' }}>
               <StaffDashboard isOffline={false} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modify Capacity Dialog */}
      <Dialog open={capacityDialogOpen} onClose={() => setCapacityDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: '100%', maxWidth: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Modify Branch Capacity</DialogTitle>
        <DialogContent>
          <TextField 
            fullWidth 
            type="number" 
            label="Total Desks" 
            value={newCapacity} 
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) {
                setNewCapacity(val);
              }
            }}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCapacityDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={() => updateCapacity()} disabled={isNaN(newCapacity) || newCapacity < 1} sx={{ fontWeight: 800, px: 3 }}>Apply Changes</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbarMessage} autoHideDuration={4000} onClose={() => setSnackbarMessage('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarMessage('')} severity="success" variant="filled" sx={{ width: '100%', fontWeight: 800, borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
