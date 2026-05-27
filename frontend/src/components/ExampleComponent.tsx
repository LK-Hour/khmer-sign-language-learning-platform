'use client';

import { useTranslation } from '@/i18n/useTranslation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Box, Container, Typography, Stack } from '@mui/material';

export function ExampleComponent() {
  const { t, locale } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('welcome')}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Current locale: <strong>{locale}</strong>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            {t('language')}:
          </Typography>
          <LocaleSwitcher />
        </Box>

        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>{t('home')}:</strong> {t('home')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('about')}:</strong> {t('about')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('lessons')}:</strong> {t('lessons')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('practice')}:</strong> {t('practice')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('login')}:</strong> {t('login')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('register')}:</strong> {t('register')}
            </Typography>
          </Stack>
        </Box>

        <Typography variant="caption" color="textSecondary">
          💡 Tip: This component demonstrates how to use the translation system.
          Copy this pattern in your own components!
        </Typography>
      </Stack>
    </Container>
  );
}
