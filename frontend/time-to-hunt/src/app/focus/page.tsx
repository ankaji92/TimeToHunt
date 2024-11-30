'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import Focus from '../components/Focus';
import Navigator from '../components/Navigator';

export default function FocusPage() {
  const [selectedCategoryId, onCategorySelect] = React.useState<number | null>(null);

  const handleStatusChange = async (gameId: number, newStatus: string) => {
    // ステータス変更後の処理が必要な場合はここに実装
    console.log(`Game ${gameId} status changed to ${newStatus}`);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="nav"
        sx={{ width: 256, flexShrink: 0 }}
      >
        <Navigator 
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={onCategorySelect}
          PaperProps={{ style: { width: 256 } }}
        />
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: '#eaeff1',
          p: 3,
        }}
      >
        <Focus onStatusChange={handleStatusChange} />
      </Box>
    </Box>
  );
} 