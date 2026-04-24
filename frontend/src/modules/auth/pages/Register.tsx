import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, InputAdornment, IconButton, Snackbar } from '@mui/material';
import { AppRegistrationOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useRegisterMutation } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../common/components/LanguageToggle';

import { AxiosError } from 'axios';

export const Register: React.FC = (): React.ReactElement => {
  const { t } = useTranslation();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<boolean>(false);

  const { mutate: register, isPending } = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg(t('allFieldsRequired'));
      return;
    }

    register(
      { name: name.trim(), phone: phone.trim(), password: password.trim() },
      {
        onSuccess: (): void => {
          setSuccessToast(true);
          setTimeout((): void => {
            navigate('/citizen/dashboard');
          }, 1500);
        },
        onError: (error: Error | AxiosError): void => {
          const axiosError = error as AxiosError<{message: string}>;
          setErrorMsg(axiosError.response?.data?.message || t('registrationFailed'));
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
        <Box sx={{ bgcolor: '#4338ca', py: 3, px: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <AppRegistrationOutlined sx={{ color: 'white', fontSize: 36, mb: 1 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('citizenSetup')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('registerSubtitle')}
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
              id="register-name"
              label={t('fullName')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Rahul Sharma"
              sx={{ mb: 2 }}
            />
            
            <TextField
              id="register-phone"
              label={t('phoneNumber')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              required
              placeholder="e.g. 9999999999"
              slotProps={{ htmlInput: { 'aria-label': 'Phone Number', minLength: 10, maxLength: 13 } }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              id="register-password"
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
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ mb: 4 }}
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
                bgcolor: '#4338ca'
              }}
            >
              {isPending ? <CircularProgress size={24} color="inherit" /> : t('register')}
            </Button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('alreadyHaveAccount')}{' '}
              <Link to="/login" style={{ color: '#4338ca', textDecoration: 'none', fontWeight: 700 }}>
                {t('loginHere')}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      <Snackbar 
        open={successToast} 
        autoHideDuration={1500} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2, fontWeight: 700 }}>
          {t('registrationSuccess')}
        </Alert>
      </Snackbar>
    </Box>
  );
};
