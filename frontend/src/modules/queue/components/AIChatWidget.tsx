import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Fab, Dialog, Stack, Avatar } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Chat as ChatIcon, SmartToy as BotIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { useMutation } from '@tanstack/react-query';
import api from '../../../common/api';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

// Chat Widget Component
export const AIChatWidget: React.FC = (): React.ReactElement => {
  const { t } = useTranslation();
  // Local state for chat UI
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const endRef = useRef<HTMLDivElement>(null);

  // Send message to Gemini backend
  const { mutate: askBot, isPending } = useMutation<string, Error, string>({
    mutationFn: async (message: string): Promise<string> => {
      const { data } = await api.post('/api/chat/ask', { message });
      return data.data.reply;
    },
    onSuccess: (reply: string): void => {
      setMessages((prev: ChatMessage[]): ChatMessage[] => [
        ...prev, 
        { role: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  });

  // Handle user input submission
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    askBot(input);
    setInput('');
  };

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  return (
    <>
      <Fab color="primary" aria-label="chat" sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }} onClick={() => setOpen(true)}>
        <ChatIcon sx={{ fontSize: 32, color: 'white' }} />
      </Fab>

      <Dialog fullScreen={false} open={open} onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { position: 'fixed', bottom: {xs: 0, sm: 24}, right: {xs: 0, sm: 24}, width: {xs: '100%', sm: 400}, height: {xs: '100%', sm: 600}, m: 0, borderRadius: {xs: 0, sm: 4}, overflow: 'hidden', display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Header */}
        <Box sx={{ bgcolor: '#075e54', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 2, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Avatar sx={{ bgcolor: '#128C7E' }}><BotIcon /></Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{t('aiGuide')}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{t('govtDocAssistant')}</Typography>
          </Box>
          <IconButton color="inherit" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, bgcolor: '#f0f2f5', p: 2, overflowY: 'auto' }}>
          <Stack spacing={2}>
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper sx={{ p: 1.5, bgcolor: '#fff3c4', color: '#66572b', borderRadius: 2, fontSize: '0.85rem', textAlign: 'center', maxWidth: '85%' }}>
                  {t('chatPlaceholder')}
                </Paper>
              </Box>
            )}
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Paper sx={{ 
                  p: 1.5, 
                  maxWidth: '85%', 
                  bgcolor: msg.role === 'user' ? '#dcf8c6' : 'white', 
                  borderRadius: msg.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                  '& p': { m: 0, mb: 0.5 },
                  '& ul, & ol': { pl: 2, m: 0 },
                  '& li': { mb: 0.5 }
                }}>
                  {msg.role === 'user' ? (
                    <Typography variant="body2" sx={{ color: '#111b21', whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                  ) : (
                    <Box sx={{ 
                      fontSize: '0.875rem', 
                      color: '#111b21',
                      '& p': { mb: 1 }
                    }}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </Box>
                  )}
                  <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.45)', display: 'block', textAlign: 'right', fontSize: '0.65rem', mt: 0.5 }}>{msg.time}</Typography>
                </Paper>
              </Box>
            ))}
            {isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper sx={{ p: 1.5, maxWidth: '80%', bgcolor: 'white', borderRadius: '0 12px 12px 12px' }}>
                  <Typography variant="body2" sx={{ color: '#111b21', fontStyle: 'italic' }}>{t('typing')}</Typography>
                </Paper>
              </Box>
            )}
            <div ref={endRef} />
          </Stack>
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField 
            fullWidth 
            placeholder={t('typeMessage')} 
            variant="outlined" 
            size="small"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 6, pr: 1 } }}
          />
          <Fab color="success" size="medium" onClick={handleSend} disabled={!input.trim() || isPending} sx={{ bgcolor: '#00a884', color: 'white', boxShadow: 'none', '&:hover': { bgcolor: '#008f6f' } }}>
            <SendIcon sx={{ ml: 0.5 }} />
          </Fab>
        </Box>
      </Dialog>
    </>
  );
};
