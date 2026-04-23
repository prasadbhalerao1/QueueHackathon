import { useMutation } from '@tanstack/react-query';
import api from '../../../common/api';

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: { phone: string; password: string }) => {
      const { data } = await api.post('/api/auth/login', credentials);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      if (data.user_name) localStorage.setItem('user_name', data.user_name);
      if (data.user_id) localStorage.setItem('user_id', data.user_id);
    },
  });
};

export const useCitizenLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: { phone: string }) => {
      const { data } = await api.post('/api/auth/citizen-login', credentials);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      if (data.user_name) localStorage.setItem('user_name', data.user_name);
      if (data.user_id) localStorage.setItem('user_id', data.user_id);
    },
  });
};




export const logout = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_role');
  window.location.href = '/login';
};
