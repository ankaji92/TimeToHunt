'use client';

import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { colors } from '@/theme/colors';
import Navigator from './components/Navigator';
import Copyright from './components/Copyright';
import { Box } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
            <Navigator 
              PaperProps={{ style: { width: 256 } }}
            />
            <Box sx={{ flexGrow: 1, bgcolor: '#eaeff1', minHeight: '100vh' }}>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  backgroundColor: '#eaeff1',
                  p: 3,
                }}
              >
              {children}
              </Box>
              <Box
                component="footer"
                sx={{
                  p: 2,
                  bgcolor: '#eaeff1',
                }}
              >
                <Copyright />
              </Box>
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
} 