import * as React from 'react';
import { Box, Paper, Typography, LinearProgress, Button } from '@mui/material';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckIcon from '@mui/icons-material/Check';
import { Game, GameStatus } from '@/app/types/game';

dayjs.extend(duration);

interface FocusProps {
  onStatusChange: (gameId: number, newStatus: string) => void;
}

export default function Focus({ onStatusChange }: FocusProps) {
  const [activeGame, setActiveGame] = React.useState<Game | null>(null);
  const [remainingTime, setRemainingTime] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);

  const fetchActiveGame = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/active_game/');
      if (response.ok) {
        const data = await response.json();
        setActiveGame(data);
      } else {
        setActiveGame(null);
      }
    } catch (error) {
      console.error('Error fetching active game:', error);
      setActiveGame(null);
    }
  }, []);

  React.useEffect(() => {
    fetchActiveGame();
  }, [fetchActiveGame]);

  React.useEffect(() => {
    if (!activeGame || activeGame.status !== 'HUNTING') return;

    const startTime = dayjs(activeGame.hunt_start_time);
    const [hours, minutes, seconds] = activeGame.estimated_hunting_time.split(':').map(Number);
    const estimatedTime = dayjs.duration({hours, minutes, seconds});
    const endTime = startTime.add(estimatedTime);

    const timer = setInterval(() => {
      const now = dayjs();
      const remaining = endTime.diff(now);
      
      if (remaining <= 0) {
        setRemainingTime('時間切れ');
        setProgress(100);
        clearInterval(timer);
      } else {
        const duration = dayjs.duration(remaining);
        setRemainingTime(
          `${duration.hours()}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
        );
        setProgress((1 - remaining / estimatedTime) * 100);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame]);

  const handleStatusChange = async (newStatus: string) => {
    if (!activeGame) return;

    try {
      const response = await fetch(`http://localhost:8000/api/games/${activeGame.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          is_active: newStatus === 'HUNTING',
        }),
      });

      if (response.ok) {
        onStatusChange(activeGame.id, newStatus);
        fetchActiveGame();  // アクティブゲームを再取得
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  if (!activeGame) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">
          現在フォーカスしているゲームはありません
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600, margin: 'auto', mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        {activeGame.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {activeGame.description}
      </Typography>

      {activeGame.status === 'HUNTING' && (
        <>
          <Typography variant="h2" align="center" sx={{ my: 4 }}>
            {remainingTime}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => handleStatusChange('CAPTURED')}
            >
              捕獲完了
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => handleStatusChange('ESCAPED')}
            >
              見失う
            </Button>
          </Box>
        </>
      )}
      
      {activeGame.status === 'NOT_STARTED' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => handleStatusChange('HUNTING')}
          >
            狩猟開始
          </Button>
        </Box>
      )}
    </Paper>
  );
} 