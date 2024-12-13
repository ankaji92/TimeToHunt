'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import Simulate from './Simulate';

export default function SimulatePage() {
  const [selectedDate, setSelectedDate] = React.useState<dayjs.Dayjs>(dayjs());

  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ flex: 1 }}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ja"
        >
          <DatePicker
            label="日付を選択"
            value={selectedDate}
            onChange={(newValue) => {
                if (newValue) {
                setSelectedDate(newValue);
                }
            }}
            format="YYYY年MM月DD日"
          />
        </LocalizationProvider>
      </Box>
      <Simulate
        selectedDate={selectedDate.toDate()}
      />
    </Box>
  );
} 