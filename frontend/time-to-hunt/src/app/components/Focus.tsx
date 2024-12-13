import * as React from 'react';
import { Box, Paper, Typography, LinearProgress, Button, ButtonGroup } from '@mui/material';
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
        setRemainingTime('Time\'s up');
        setProgress(100);
        clearInterval(timer);
      } else {
        const duration = dayjs.duration(remaining);
        setRemainingTime(
          `${duration.hours()}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
        );
        setProgress((1 - remaining / estimatedTime.asMilliseconds()) * 100);
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
        fetchActiveGame();  // Re-fetch the active game
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  if (!activeGame) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">
          No game currently in focus
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Currently Active Game
        </Typography>
        <Typography variant="body1">
          Title: {activeGame.species_title}
        </Typography>
        <Typography variant="body1">
          Status: {activeGame.status}
        </Typography>
        <Typography variant="body1">
          Remaining Time: {activeGame.remaining_time}
        </Typography>
        {/* ... other information display ... */}
      </Paper>
      <ButtonGroup variant="contained">
        <Button
          onClick={() => handleStatusChange('HUNTING')}
          disabled={activeGame.status === 'HUNTING'}
        >
          Start Hunting
        </Button>
        <Button
          onClick={() => handleStatusChange('PENDING')}
          disabled={activeGame.status === 'PENDING'}
        >
          Pause
        </Button>
        <Button
          onClick={() => handleStatusChange('CAPTURED')}
          disabled={activeGame.status === 'CAPTURED'}
        >
          Complete
        </Button>
        <Button
          onClick={() => handleStatusChange('ESCAPED')}
          disabled={activeGame.status === 'ESCAPED'}
        >
          Give Up
        </Button>
      </ButtonGroup>
    </Box>
  );
} 