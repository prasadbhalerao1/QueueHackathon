// @ts-nocheck
import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress, Snackbar, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { useAnalytics, useBranches } from '../../queue/hooks/useQueue';
import { StaffDashboard } from '../../queue/components/StaffDashboard';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const { data: analytics, isLoading } = useAnalytics(selectedBranchId, !!selectedBranchId);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { mutate: toggleRush, isPending: isTogglingRush } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/queue/rush/${selectedBranchId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setSnackbarMessage('Rush Protocol toggled successfully');
    }
  });

  const { mutate: triggerVip, isPending: isTriggeringVip } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/queue/vip/${selectedBranchId}`);
      return data;
    },
    onSuccess: () => {
      setSnackbarMessage('VIP Token created successfully');
      queryClient.invalidateQueries({ queryKey: ['queue', selectedBranchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', selectedBranchId] });
    }
  });

  const theme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: '#f5f5f5',
      }
    },
  });

  if (branchesLoading) {
    return <Box p={3}><CircularProgress /></Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box p={4} maxWidth="1200px" margin="0 auto">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom color="textPrimary">
            Admin Control Center
          </Typography>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranchId} label="Branch" onChange={(e) => setSelectedBranchId(e.target.value)}>
              {branches?.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {analytics?.rush_mode && (
          <Alert severity="error" variant="filled" sx={{ mb: 3, fontWeight: 'bold' }}>
            ⚠️ RUSH PROTOCOL IS CURRENTLY ACTIVE FOR THIS BRANCH ⚠️
          </Alert>
        )}

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', textAlign: 'center', p: 2, boxShadow: 3 }}>
              <Typography variant="h6">Tokens Served</Typography>
              <Typography variant="h3" fontWeight="bold">{isLoading ? '-' : analytics?.tokens_served_today || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'secondary.main', color: 'white', textAlign: 'center', p: 2, boxShadow: 3 }}>
              <Typography variant="h6">Waiting</Typography>
              <Typography variant="h3" fontWeight="bold">{isLoading ? '-' : analytics?.tokens_waiting || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.main', color: 'white', textAlign: 'center', p: 2, boxShadow: 3 }}>
              <Typography variant="h6">Avg Wait</Typography>
              <Typography variant="h3" fontWeight="bold">{isLoading ? '-' : `${analytics?.avg_wait_minutes}m`}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.main', color: 'white', textAlign: 'center', p: 2, boxShadow: 3 }}>
              <Typography variant="h6">No-Show</Typography>
              <Typography variant="h3" fontWeight="bold">{isLoading ? '-' : `${analytics?.no_show_percentage}%`}</Typography>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Emergency Operations</Typography>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ border: '2px solid', borderColor: 'error.main', height: '100%' }}>
              <CardContent>
                <Typography variant="h5" color="error.main" fontWeight="bold" gutterBottom>
                  RUSH PROTOCOL
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Halts all new walk-ins and alerts waiting citizens of severe delays.
                </Typography>
                <Button 
                  variant="contained" 
                  color={analytics?.rush_mode ? "success" : "error"} 
                  size="large"
                  fullWidth 
                  onClick={() => toggleRush()}
                  disabled={isTogglingRush || !selectedBranchId}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {isTogglingRush ? 'Toggling...' : analytics?.rush_mode ? 'DEACTIVATE RUSH PROTOCOL' : 'ACTIVATE RUSH PROTOCOL'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ border: '2px solid', borderColor: 'warning.main', height: '100%' }}>
              <CardContent>
                <Typography variant="h5" color="warning.main" fontWeight="bold" gutterBottom>
                  VIP OVERRIDE
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Inject a priority level 1 token directly into the queue bypassing all wait lines.
                </Typography>
                <Button 
                  variant="contained" 
                  color="warning" 
                  size="large"
                  fullWidth 
                  onClick={() => triggerVip()}
                  disabled={isTriggeringVip || !selectedBranchId}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {isTriggeringVip ? 'Processing...' : 'GENERATE VIP TOKEN'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Hackathon Flex: Render Staff Dashboard inside Admin Dashboard */}
        <Box border="2px dashed gray" p={3} borderRadius={2} bgcolor="background.default" mt={4}>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom align="center" fontWeight="bold">
            -- LIVE STAFF DASHBOARD PREVIEW --
          </Typography>
          <StaffDashboard isOffline={false} />
        </Box>

        <Snackbar open={!!snackbarMessage} autoHideDuration={4000} onClose={() => setSnackbarMessage('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbarMessage('')} severity="success" sx={{ width: '100%', fontWeight: 'bold' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};
