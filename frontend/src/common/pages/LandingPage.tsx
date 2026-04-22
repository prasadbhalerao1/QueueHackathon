import React, { useState } from 'react';
import {
  Box, Typography, Button, Container, TextField, Paper, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Chip, CircularProgress, Alert, Divider, Stack
} from '@mui/material';
import {
  QrCodeScanner, AdminPanelSettings, HelpOutlined,
  ArrowForward, CheckCircle, Close, PhoneAndroid,
  AccessTime, LocationOn
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TokenResult {
  token_number: string;
  status: string;
  service?: { name: string };
  branch?: { name: string };
  expected_service_time: string | null;
}

// ─── Status chip color map ────────────────────────────────────────────────────
const statusColor = (s: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
  if (s === 'CALLED') return 'success';
  if (s === 'IN_PROGRESS') return 'info';
  if (s === 'WAITING' || s === 'ARRIVED') return 'warning';
  if (s === 'NO_SHOW' || s === 'CANCELLED') return 'error';
  return 'default';
};

// ─── Stat pill ────────────────────────────────────────────────────────────────
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ textAlign: 'center', px: { xs: 2, sm: 4 } }}>
    <Box sx={{ color: 'primary.light', mb: 0.5 }}>{icon}</Box>
    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>{value}</Typography>
    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const navigate = useNavigate();

  // Forgot token dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<TokenResult[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/track/${tokenInput.trim().toUpperCase()}`);
    }
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResults(null);
    try {
      const { data } = await api.get(`/api/queue/lookup-by-phone?phone=${encodeURIComponent(phone.trim())}`);
      setLookupResults(data.data ?? []);
    } catch {
      setLookupError('Could not fetch tokens. Please check the phone number and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCloseForgot = () => {
    setForgotOpen(false);
    setPhone('');
    setLookupResults(null);
    setLookupError('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── Hero ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
        pt: { xs: 8, md: 14 },
        pb: { xs: 10, md: 16 },
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        {[{ top: '-15%', left: '-10%' }, { bottom: '-20%', right: '-8%' }].map((pos, i) => (
          <Box key={i} sx={{
            position: 'absolute', ...pos,
            width: '45vw', height: '45vw', borderRadius: '50%',
            background: i === 0
              ? 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        ))}

        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          {/* Badge */}
          <Chip
            label="🇮🇳  Smart Public Services Platform"
            sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontWeight: 600, backdropFilter: 'blur(8px)' }}
          />

          <Typography variant="h1" sx={{
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 900,
            background: 'linear-gradient(90deg, #ffffff 0%, #93c5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            lineHeight: 1.1,
          }}>
            QueueOS
          </Typography>
          <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: 560, mx: 'auto', lineHeight: 1.7, mb: 5 }}>
            Skip the waiting room. Track your government queue token in real-time from anywhere.
          </Typography>

          {/* Inline Track Form */}
          <Box
            component="form"
            onSubmit={handleTrack}
            sx={{
              display: 'flex', gap: 1.5, maxWidth: 520, mx: 'auto',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              id="hero-token-input"
              fullWidth
              placeholder="Enter token number (e.g. A-125)"
              variant="outlined"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': 'Token number', style: { fontWeight: 700, fontSize: '1.05rem' } } }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <Button
              id="hero-track-btn"
              type="submit"
              variant="contained"
              size="large"
              disabled={!tokenInput.trim()}
              endIcon={<ArrowForward />}
              sx={{ px: 4, whiteSpace: 'nowrap', py: 1.7, borderRadius: 2, fontSize: '1rem' }}
            >
              Track Live
            </Button>
          </Box>

          {/* Forgot token */}
          <Button
            id="forgot-token-btn"
            startIcon={<HelpOutlined />}
            onClick={() => setForgotOpen(true)}
            sx={{ mt: 2, color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', textTransform: 'none', '&:hover': { color: 'white' } }}
          >
            Forgot your token number?
          </Button>
        </Container>

        {/* Stat strip */}
        <Box sx={{ mt: 8, borderTop: '1px solid rgba(255,255,255,0.1)', pt: 5 }}>
          <Stack direction="row" sx={{ justifyContent: "center" }} divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
            <StatPill icon={<QrCodeScanner />} label="Real-Time Tracking" value="PWA" />
            <StatPill icon={<AccessTime />} label="Live Wait Time" value="< 1s" />
            <StatPill icon={<PhoneAndroid />} label="WhatsApp AI Booking" value="24/7" />
          </Stack>
        </Box>
      </Box>

      {/* ── Action cards ── */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Grid container spacing={3}>

          {/* Staff / Admin Portal */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 4, height: '100%',
              border: '1.5px solid', borderColor: 'primary.light',
              background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
              display: 'flex', flexDirection: 'column', gap: 2,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: '0 12px 40px rgba(37,99,235,0.15)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 1, display: 'flex' }}>
                  <AdminPanelSettings sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Staff & Admin Portal</Typography>
                  <Typography variant="caption" color="text.secondary">Secure access for officers and managers</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Manage queues, call tokens, register walk-ins, view live analytics, and control branch settings.
              </Typography>
              <Button
                id="staff-login-btn"
                component={Link}
                to="/login"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                endIcon={<ArrowForward />}
                sx={{ mt: 'auto' }}
                aria-label="Go to staff login"
              >
                Staff Login
              </Button>
            </Paper>
          </Grid>

          {/* Forgot Token Lookup Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 4, height: '100%',
              border: '1.5px solid #e2e8f0',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              display: 'flex', flexDirection: 'column', gap: 2,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: '#0f172a', borderRadius: 2, p: 1, display: 'flex' }}>
                  <HelpOutlined sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Forgot Token Number?</Typography>
                  <Typography variant="caption" color="text.secondary">Look up using your phone number</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Don't remember your token? Enter the phone number you booked with and we'll show all your active queue positions.
              </Typography>
              <Button
                id="forgot-token-card-btn"
                variant="outlined"
                color="secondary"
                size="large"
                fullWidth
                onClick={() => setForgotOpen(true)}
                endIcon={<PhoneAndroid />}
                sx={{ mt: 'auto', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                aria-label="Look up token by phone number"
              >
                Find My Tokens
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* ── Forgot Token Dialog ── */}
      <Dialog
        open={forgotOpen}
        onClose={handleCloseForgot}
        maxWidth="sm"
        fullWidth
        aria-labelledby="forgot-token-dialog-title"
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle id="forgot-token-dialog-title" sx={{ fontWeight: 800, pb: 0 }}>
          Find Your Active Tokens
          <IconButton
            aria-label="Close dialog"
            onClick={handleCloseForgot}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the phone number you used to book via WhatsApp or at the counter. We'll show all your active queue positions.
          </Typography>

          <Box component="form" onSubmit={handlePhoneLookup} sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              id="phone-lookup-input"
              fullWidth
              label="Phone Number"
              placeholder="e.g. 7770000001"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': 'Phone number for token lookup', maxLength: 13 } }}
              autoFocus
            />
            <Button
              id="phone-lookup-btn"
              type="submit"
              variant="contained"
              size="large"
              disabled={lookupLoading || !phone.trim()}
              sx={{ whiteSpace: 'nowrap', px: 3 }}
            >
              {lookupLoading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
            </Button>
          </Box>

          {lookupError && <Alert severity="error" sx={{ mt: 2 }}>{lookupError}</Alert>}

          {/* Results */}
          {lookupResults !== null && (
            <Box sx={{ mt: 3 }}>
              {lookupResults.length === 0 ? (
                <Alert severity="info" icon={false} sx={{ borderRadius: 3 }}>
                  No active tokens found for <strong>{phone}</strong>. You may have no bookings, or your session has already completed.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Found {lookupResults.length} active token{lookupResults.length > 1 ? 's' : ''}:
                  </Typography>
                  {lookupResults.map((t) => (
                    <Paper
                      key={t.token_number}
                      variant="outlined"
                      sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{t.token_number}</Typography>
                          <Chip label={t.status.replace('_', ' ')} color={statusColor(t.status)} size="small" sx={{ fontWeight: 700 }} />
                        </Box>
                        {t.service?.name && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            <CheckCircle sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle', color: 'success.main' }} />
                            {t.service.name}
                          </Typography>
                        )}
                        {t.branch?.name && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 12 }} />{t.branch.name}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => { handleCloseForgot(); navigate(`/track/${t.token_number}`); }}
                        endIcon={<ArrowForward />}
                        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        aria-label={`Track token ${t.token_number}`}
                      >
                        Track
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseForgot} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
