import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * Reusable language toggle component.
 * Drop this into any page header to enable English ↔ मराठी switching.
 */
export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (lang?: string) => {
    if (lang) i18n.changeLanguage(lang);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        startIcon={<Translate />}
        onClick={handleClick}
        size="small"
        sx={{
          color: '#64748b',
          fontWeight: 600,
          textTransform: 'none',
          minWidth: 'auto',
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
        }}
      >
        {i18n.language === 'en' ? 'EN' : 'मरा'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        <MenuItem onClick={() => handleClose('en')} selected={i18n.language === 'en'} sx={{ fontWeight: 600 }}>
          English
        </MenuItem>
        <MenuItem onClick={() => handleClose('mr')} selected={i18n.language === 'mr'} sx={{ fontWeight: 600 }}>
          मराठी
        </MenuItem>
      </Menu>
    </>
  );
};
