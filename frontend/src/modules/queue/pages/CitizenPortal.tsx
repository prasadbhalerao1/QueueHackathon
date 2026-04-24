import React, { useState } from 'react';
import { Box, Container, Grid, Card, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Paper, Stack, Stepper, Step, StepLabel, Divider } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../common/api';
import { useBranches, useServices } from '../hooks/useQueue';
import { AIChatWidget } from '../components/AIChatWidget';
import { CheckCircleOutlined, AccessTime, LocationOn, PersonOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../common/components/LanguageToggle';

// Main Citizen Booking Portal Component
export const CitizenPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step definitions for the booking wizard
  const steps = [t('stepSelectService'), t('stepChooseBranch'), t('stepCitizenDetails'), t('stepConfirm')];

  // Fetch required data
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: services, isLoading: servicesLoading } = useServices();
  
  // Wizard state management
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceId: '',
    branchId: '',
    scheduledTime: ''
  });

  // Query AI Crowd Predictor based on selected branch
  const { data: crowdData, isLoading: crowdLoading } = useQuery({
    queryKey: ['crowd-predict', formData.branchId],
    queryFn: async () => {
      if (!formData.branchId) return null;
      const { data } = await api.get(`/api/ml/predict-crowd/${formData.branchId}`);
      return data.data;
    },
    enabled: !!formData.branchId
  });

  // Mutation to book the appointment
  const { mutate: bookAppointment, isPending: isBooking } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/queue/web-booking', {
        name: formData.name,
        phone: formData.phone,
        service_id: formData.serviceId,
        branch_id: formData.branchId,
        scheduled_time: new Date(formData.scheduledTime).toISOString()
      });
      return data.data;
    },
    onSuccess: (data) => {
      navigate(`/track/${data.token_number}`);
    }
  });

  const handleNext = () => setActiveStep((prev: number) => prev + 1);
  const handleBack = () => setActiveStep((prev: number) => prev - 1);

  // Render the current step in the wizard
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={4} sx={{ py: { xs: 2, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>{t('whatService')}</Typography>
            <Grid container spacing={2}>
              {servicesLoading ? <CircularProgress /> : services?.map(s => (
                <Grid size={{xs: 12, sm: 6}} key={s.id}>
                  <Card 
                    elevation={formData.serviceId === s.id ? 8 : 1}
                    sx={{ 
                      p: { xs: 2, sm: 3 }, 
                      cursor: 'pointer', 
                      borderRadius: 3, 
                      border: formData.serviceId === s.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      bgcolor: formData.serviceId === s.id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
                    }}
                    onClick={() => setFormData({...formData, serviceId: s.id!})}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('estTime')}: {s.base_duration_minutes} {t('mins')}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        );
      case 1:
        return (
          <Grid container spacing={3} sx={{ py: 2 }}>
            <Grid size={{xs: 12, md: 6}}>
              <Stack spacing={3}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>{t('selectBranch')}</Typography>
                <FormControl fullWidth disabled={branchesLoading}>
                  <InputLabel>{t('branchLocation')}</InputLabel>
                  <Select value={formData.branchId} label={t('branchLocation')} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                    {branches?.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Card sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', minHeight: { xs: 'auto', md: 250 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: '#1e293b', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{t('requirementsStatus')}</Typography>
                
                {/* Dynamic Required Documents */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>{t('requiredDocs')}</Typography>
                  {services?.find(s => s.id === formData.serviceId)?.required_docs?.length ? (
                    <Box component="ul" sx={{ m: 0, pl: 2, color: '#334155' }}>
                      {services.find(s => s.id === formData.serviceId)?.required_docs?.map((doc: string, idx: number) => (
                        <li key={idx}><Typography variant="body2" sx={{ fontWeight: 600 }}>{doc}</Typography></li>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>{t('selectServiceFirst')}</Typography>
                  )}
                </Box>
                <Divider sx={{ my: 3 }} />

                {/* Crowd Status */}
                {!formData.branchId ? (
                  <Typography color="text.secondary" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>{t('selectBranchCrowd')}</Typography>
                ) : crowdLoading ? (
                  <CircularProgress size={24} />
                ) : crowdData ? (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t('liveCrowdLevel')}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', sm: '2.125rem' }, color: crowdData.crowd_level === 'HIGH' ? '#ef4444' : crowdData.crowd_level === 'MEDIUM' ? '#f59e0b' : '#10b981' }}>
                        {crowdData.crowd_level}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t('suggestedVisitTime')}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{crowdData.best_time_to_visit}</Typography>
                    </Box>
                  </Stack>
                ) : null}
              </Card>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3} sx={{ py: { xs: 2, md: 4 } }}>
            <Grid size={{xs: 12, md: 6}}>
              <Stack spacing={3}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>{t('yourDetails')}</Typography>
                <TextField label={t('fullName')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} fullWidth variant="outlined" />
                <TextField label={t('phoneNumber')} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} fullWidth variant="outlined" placeholder="+91 9999999999" />
              </Stack>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Stack spacing={3}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>{t('pickTime')}</Typography>
                <TextField 
                  label={t('selectDateTime')} 
                  type="datetime-local" 
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={formData.scheduledTime}
                  onChange={e => setFormData({...formData, scheduledTime: e.target.value})}
                  fullWidth 
                  variant="outlined"
                  helperText={t('timeHelper')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'white' } }}
                />
              </Stack>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Stack spacing={4} sx={{ py: { xs: 2, md: 4 }, alignItems: 'center' }}>
            <CheckCircleOutlined sx={{ fontSize: { xs: 48, md: 64 }, color: '#10b981' }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2.125rem' }, textAlign: 'center' }}>{t('readyConfirm')}</Typography>
            <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, width: '100%', maxWidth: 500, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><PersonOutlined color="primary"/> <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{formData.name} ({formData.phone})</Typography></Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><LocationOn color="primary"/> <Typography sx={{ fontWeight: 600 }}>{branches?.find(b => b.id === formData.branchId)?.name}</Typography></Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><AccessTime color="primary"/> <Typography sx={{ fontWeight: 600 }}>{new Date(formData.scheduledTime).toLocaleString()}</Typography></Box>
              </Stack>
            </Paper>
          </Stack>
        );
      default:
        return null;
    }
  };

  // Validate step completion
  const isStepValid = () => {
    if (activeStep === 0) return !!formData.serviceId;
    if (activeStep === 1) return !!formData.branchId;
    if (activeStep === 2) return !!formData.name && !!formData.phone && !!formData.scheduledTime;
    return true;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: { xs: 3, md: 8 } }}>
      <Container maxWidth="md">
        {/* Header with language toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box />
          <LanguageToggle />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#0f172a', textAlign: 'center', letterSpacing: '-1px', fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
          {t('ePortalTitle')}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#64748b', textAlign: 'center', mb: { xs: 3, md: 6 }, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          {t('ePortalSubtitle')}
        </Typography>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 6 }, borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { fontSize: { xs: '0.7rem', sm: '0.875rem' } } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 2, md: 4 }, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            <Button disabled={activeStep === 0} onClick={handleBack} sx={{ fontWeight: 700, px: { xs: 2, sm: 4 } }}>
              {t('back')}
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                onClick={() => bookAppointment()} 
                disabled={isBooking}
                sx={{ fontWeight: 800, px: { xs: 3, sm: 6 }, py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {isBooking ? <CircularProgress size={24} color="inherit" /> : t('confirmBooking')}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext} 
                disabled={!isStepValid()}
                sx={{ fontWeight: 800, px: { xs: 3, sm: 6 }, py: 1.5, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                {t('continue')}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
      
      <AIChatWidget />
    </Box>
  );
};
