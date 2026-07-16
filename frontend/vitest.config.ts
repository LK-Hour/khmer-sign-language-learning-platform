import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
    server: {
      deps: {
        inline: [
          '@mui/material',
          '@mui/icons-material',
          '@emotion/react',
          '@emotion/styled',
          'react-transition-group',
        ],
      },
    },
  },
});
