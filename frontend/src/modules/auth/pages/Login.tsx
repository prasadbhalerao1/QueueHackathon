import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, Divider, InputAdornment, IconButton } from '@mui/material';
import { LockOutlined, BadgeOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useLoginMutation } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../common/components/LanguageToggle';

import { AxiosError } from 'axios';

interface LoginResponse {
  role: 'ADMIN' | 'CITIZEN' | 'STAFF' | 'OFFICER';
  [key: string]: unknown;
}

export const Login: React.FC = (): React.ReactElement => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { mutate: staffLogin, isPending } = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setErrorMsg('');
    staffLogin(
      { phone: phone.trim(), password: password.trim() },
      {
        onSuccess: (data: LoginResponse): void => {
          if (data.role === 'ADMIN') navigate('/admin');
          else if (data.role === 'CITIZEN') navigate('/citizen/dashboard');
          else navigate('/staff');
        },
        onError: (error: Error | AxiosError): void => {
          const axiosError = error as AxiosError<{message: string}>;
          setErrorMsg(axiosError.response?.data?.message || t('loginFailed'));
        },
      }
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f0f4ff',
        p: 2,
        background: 'linear-gradient(135deg, #e8eaf6 0%, #e3f2fd 100%)',
      }}
    >
      {/* Language toggle — top right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <LanguageToggle />
      </Box>

      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Header Band */}
        <Box sx={{ bgcolor: 'primary.main', py: 3, px: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <LockOutlined sx={{ color: 'white', fontSize: 36, mb: 1 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('secureAccess')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('loginSubtitle')}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              id="login-phone"
              label={t('phoneNumber')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              required
              autoFocus
              placeholder="e.g. 9999999999"
              slotProps={{ htmlInput: { 'aria-label': 'Phone Number', minLength: 10, maxLength: 13 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              id="login-password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value.trimStart())}
              required
              slotProps={{ 
                htmlInput: { 'aria-label': 'Password' },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="toggle password visibility">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isPending}
              sx={{
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                },
              }}
            >
              {isPending ? <CircularProgress size={24} color="inherit" /> : t('secureLogin')}
            </Button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noAccount')}{' '}
              <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 700 }}>
                {t('registerHere')}
              </Link>
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Citizen Helper */}
          <Box sx={{ textAlign: 'center' }}>
            <BadgeOutlined sx={{ color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('citizenHelper')}
            </Typography>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="primary"
              size="small"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              {t('trackMyToken')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
