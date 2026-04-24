import React, { useState } from 'react';
import {
  Box, Typography, Button, Container, TextField, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Chip, CircularProgress, Alert, Stack
} from '@mui/material';
import {
  AdminPanelSettings, HelpOutlined, ArrowForward, CheckCircle, 
  Close, PhoneAndroid, AccessTime, LocationOn, EventAvailable, 
  Dashboard, QrCodeScanner
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { LanguageToggle } from '../components/LanguageToggle';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TokenResult {
  token_number: string;
  status: string;
  service?: { name: string };
  branch?: { name: string };
  expected_service_time: string | null;
}

type StatusColor = 'success' | 'warning' | 'info' | 'error' | 'default';

// ─── Status chip color map ────────────────────────────────────────────────────
const statusColor = (s: string): StatusColor => {
  if (s === 'CALLED') return 'success';
  if (s === 'IN_PROGRESS') return 'info';
  if (s === 'WAITING' || s === 'ARRIVED') return 'warning';
  if (s === 'NO_SHOW' || s === 'CANCELLED') return 'error';
  return 'default';
};

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
const StatPill: React.FC<StatPillProps> = ({ icon, label, value }): React.ReactElement => (
  <Paper elevation={0} sx={{ 
    display: 'flex', alignItems: 'center', gap: 2, p: 3, 
    borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff',
    flex: 1, minWidth: 280
  }}>
    <Box sx={{ color: '#2563eb', display: 'flex', p: 1.5, bgcolor: '#eff6ff', borderRadius: 2 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{label}</Typography>
    </Box>
  </Paper>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const LandingPage: React.FC = (): React.ReactElement => {
  const { t } = useTranslation();
  const [tokenInput, setTokenInput] = useState<string>('');
  const navigate = useNavigate();

  const token: string | null = localStorage.getItem('jwt_token');
  const userRole: string | null = localStorage.getItem('user_role');
  const isLoggedIn: boolean = !!token;
  const dashboardLink: string = userRole === 'ADMIN' ? '/admin' : userRole === 'OFFICER' ? '/staff' : '/citizen/dashboard';

  // Forgot token dialog
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [lookupResults, setLookupResults] = useState<TokenResult[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string>('');

  const handleTrack = (e: React.FormEvent<HTMLFormElement | HTMLDivElement>): void => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/track/${tokenInput.trim().toUpperCase()}`);
    }
  };

  const handlePhoneLookup = async (e: React.FormEvent<HTMLFormElement | HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResults(null);
    try {
      const { data } = await api.get<{data: TokenResult[]}>(`/api/queue/lookup-by-phone?phone=${encodeURIComponent(phone.trim())}`);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', py: 2 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            {t('queueos')}
          </Typography>
          
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LanguageToggle />

            <Button 
              component={Link} 
              to={isLoggedIn ? dashboardLink : "/login"} 
              variant="outlined"
              size="small"
              sx={{ borderColor: '#e2e8f0', color: '#0f172a', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 } }}
            >
              {isLoggedIn ? t('dashboard') : t('signIn')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── Hero ── */}
      <Box sx={{ 
        pt: { xs: 8, md: 12 }, 
        pb: { xs: 6, md: 10 }, 
        px: 2,
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
            
            {/* Left Content */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Chip
                label={t('govCenters')}
                size="small"
                sx={{ mb: 4, bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700, borderRadius: 2 }}
              />

              <Typography variant="h1" sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 800,
                color: '#0f172a',
                mb: 3,
                lineHeight: 1.1,
                letterSpacing: '-1px'
              }}>
                {t('smartQueue').split(' ')[0]} <Box component="br" sx={{ display: { xs: 'none', md: 'block' } }}/> {t('smartQueue').split(' ').slice(1).join(' ')}
              </Typography>
              
              <Typography variant="h6" sx={{ color: '#475569', fontWeight: 400, maxWidth: 500, mx: { xs: 'auto', md: 0 }, mb: 6, lineHeight: 1.6 }}>
                {t('heroDesc')}
              </Typography>

              {/* Inline Track Form */}
              <Paper 
                component="form"
                onSubmit={handleTrack}
                elevation={0}
                sx={{
                  display: 'flex', p: 1, maxWidth: 450, mx: { xs: 'auto', md: 0 }, mb: 2,
                  bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  flexDirection: { xs: 'column', sm: 'row' }, gap: 1
                }}
              >
                <TextField
                  id="hero-token-input"
                  fullWidth
                  placeholder={t('enterToken')}
                  variant="outlined"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  slotProps={{ 
                    htmlInput: { 'aria-label': 'Token number', style: { fontWeight: 600, fontSize: '1rem', padding: '12px 16px', color: '#0f172a' } },
                  }}
                  sx={{ '& fieldset': { border: 'none' }, bgcolor: 'transparent' }}
                />
                <Button
                  id="hero-track-btn"
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!tokenInput.trim()}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, bgcolor: '#0f172a', color: '#ffffff', '&:hover': { bgcolor: '#1e293b' }, whiteSpace: 'nowrap' }}
                >
                  {t('trackLive')}
                </Button>
              </Paper>

              <Button
                id="forgot-token-btn"
                startIcon={<HelpOutlined />}
                onClick={() => setForgotOpen(true)}
                sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', '&:hover': { color: '#0f172a', bgcolor: 'transparent' } }}
              >
                {t('lostToken')}
              </Button>
            </Box>

            {/* Right Visual (CSS-only Mockup) */}
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', position: 'relative', height: 400, alignItems: 'center' }}>
              
              {/* Main Ticket Mockup */}
              <Paper elevation={0} sx={{
                width: 300, p: 4, borderRadius: 4,
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                bgcolor: '#ffffff', zIndex: 2,
                position: 'relative'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{t('liveToken')}</Typography>
                  <Chip size="small" label={t('inProgress')} sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800, borderRadius: 1 }} />
                </Box>
                
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0f172a', textAlign: 'center', mb: 0.5, letterSpacing: '-1px' }}>
                  A-125
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', color: '#64748b', mb: 4, fontWeight: 500 }}>
                  Income Certificate
                </Typography>
                
                <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 3, border: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>{t('estWait')}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>12 Mins</Typography>
                </Box>
              </Paper>
              
              {/* Floating Element 1 */}
              <Paper elevation={0} sx={{ 
                position: 'absolute', top: 40, right: 10, p: 2, borderRadius: 3, 
                border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', 
                display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 3, bgcolor: '#ffffff' 
              }}>
                <CheckCircle sx={{ color: '#16a34a' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1 }}>{t('nowServing')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>A-124</Typography>
                </Box>
              </Paper>

              {/* Floating Element 2 */}
              <Paper elevation={0} sx={{ 
                position: 'absolute', bottom: 30, left: 0, p: 2, borderRadius: 3, 
                border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', 
                display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1, bgcolor: '#ffffff' 
              }}>
                <Box sx={{ bgcolor: '#dcfce7', p: 1, borderRadius: 2, display: 'flex' }}>
                  <LocationOn sx={{ color: '#16a34a', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1 }}>{t('counter')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>Desk 3</Typography>
                </Box>
              </Paper>

            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Stats Strip ── */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'center' }}>
          <StatPill icon={<AccessTime fontSize="large" />} label={t('waitSaved')} value={t('waitSavedVal')} />
          <StatPill icon={<QrCodeScanner fontSize="large" />} label={t('liveUpdates')} value={t('liveUpdatesVal')} />
          <StatPill icon={<PhoneAndroid fontSize="large" />} label={t('whatsappInt')} value={t('whatsappIntVal')} />
        </Box>
      </Container>

      {/* ── Action cards ── */}
      <Box sx={{ bgcolor: '#ffffff', py: { xs: 5, md: 10 }, borderTop: '1px solid #e2e8f0', flexGrow: 1 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 800, color: '#0f172a', mb: 6, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.5px' }}>
            {t('portalAccess')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'center', alignItems: 'stretch' }}>

            {/* Book Appointment Portal */}
            <Paper elevation={0} sx={{
              p: { xs: 3, sm: 5 }, borderRadius: 3, flex: 1, minWidth: { md: 0 },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff',
              display: 'flex', flexDirection: 'column', gap: 3
            }}>
              <Box sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EventAvailable sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>{t('bookAppt')}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('bookApptDesc')}
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/portal"
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForward />}
                sx={{ mt: 'auto', py: 1.5, bgcolor: '#16a34a', color: '#ffffff', borderRadius: 2, '&:hover': { bgcolor: '#15803d' }, boxShadow: 'none' }}
              >
                {t('bookNow')}
              </Button>
            </Paper>

            {/* Citizen Dashboard */}
            <Paper elevation={0} sx={{
              p: { xs: 3, sm: 5 }, borderRadius: 3, flex: 1, minWidth: { md: 0 },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff',
              display: 'flex', flexDirection: 'column', gap: 3
            }}>
              <Box sx={{ bgcolor: '#f1f5f9', color: '#475569', width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dashboard sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>{t('citizenDash')}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('citizenDashDesc')}
                </Typography>
              </Box>
              <Button
                component={Link}
                to={isLoggedIn ? dashboardLink : "/login"}
                variant="outlined"
                size="large"
                fullWidth
                endIcon={<ArrowForward />}
                sx={{ mt: 'auto', py: 1.5, color: '#0f172a', borderColor: '#e2e8f0', borderRadius: 2, '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
              >
                {isLoggedIn ? t('dashboard') : t('signIn')}
              </Button>
            </Paper>

            {/* Staff / Admin Portal */}
            <Paper elevation={0} sx={{
              p: { xs: 3, sm: 5 }, borderRadius: 3, flex: 1, minWidth: { md: 0 },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff',
              display: 'flex', flexDirection: 'column', gap: 3
            }}>
              <Box sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AdminPanelSettings sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>{t('staffPortal')}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('staffPortalDesc')}
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForward />}
                sx={{ mt: 'auto', py: 1.5, bgcolor: '#2563eb', color: '#ffffff', borderRadius: 2, '&:hover': { bgcolor: '#1d4ed8' }, boxShadow: 'none' }}
              >
                {t('staffLogin')}
              </Button>
            </Paper>

          </Box>
        </Container>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ bgcolor: '#f8fafc', py: 4, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('footerText', { year: new Date().getFullYear() })}
        </Typography>
      </Box>

      {/* ── Forgot Token Dialog ── */}
      <Dialog
        open={forgotOpen}
        onClose={handleCloseForgot}
        maxWidth="sm"
        fullWidth
        aria-labelledby="forgot-token-dialog-title"
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, elevation: 0, border: '1px solid #e2e8f0' } } }}
      >
        <DialogTitle id="forgot-token-dialog-title" sx={{ fontWeight: 800, pb: 0, color: '#0f172a' }}>
          Find Your Active Tokens
          <IconButton
            aria-label="Close dialog"
            onClick={handleCloseForgot}
            sx={{ position: 'absolute', right: 16, top: 16, color: '#64748b' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
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
              sx={{ whiteSpace: 'nowrap', px: 3, bgcolor: '#0f172a', color: '#ffffff', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none' }}
            >
              {lookupLoading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
            </Button>
          </Box>

          {lookupError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{lookupError}</Alert>}

          {/* Results */}
          {lookupResults !== null && (
            <Box sx={{ mt: 3 }}>
              {lookupResults.length === 0 ? (
                <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
                  No active tokens found for <strong>{phone}</strong>. You may have no bookings, or your session has already completed.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>
                    Found {lookupResults.length} active token{lookupResults.length > 1 ? 's' : ''}:
                  </Typography>
                  {lookupResults.map((t) => (
                    <Paper
                      key={t.token_number}
                      variant="outlined"
                      sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderColor: '#e2e8f0' }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{t.token_number}</Typography>
                          <Chip label={t.status.replace('_', ' ')} color={statusColor(t.status)} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
                        </Box>
                        {t.service?.name && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            <CheckCircle sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle', color: '#16a34a' }} />
                            {t.service.name}
                          </Typography>
                        )}
                        {t.branch?.name && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationOn sx={{ fontSize: 12 }} />{t.branch.name}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => { handleCloseForgot(); navigate(`/track/${t.token_number}`); }}
                        endIcon={<ArrowForward />}
                        sx={{ whiteSpace: 'nowrap', flexShrink: 0, borderColor: '#e2e8f0', color: '#0f172a' }}
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
          <Button onClick={handleCloseForgot} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
