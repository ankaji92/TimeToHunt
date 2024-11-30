'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Navigator from './components/Navigator';
import Content from './components/Content';
import Copyright from './components/Copyright';

export default function App() {
  const [selectedCategoryId, onCategorySelect] = React.useState<number | null>(null);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigator 
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={onCategorySelect}
        PaperProps={{ style: { width: 256 } }}
        sx={{ display: { sm: 'block', xs: 'none' } }}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, py: 6, px: 4, bgcolor: '#eaeff1' }}>
          <Content
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={onCategorySelect}
          />
        </Box>
        <Box component="footer" sx={{ p: 2, bgcolor: '#eaeff1' }}>
          <Copyright />
        </Box>
      </Box>
    </Box>
  );
}
