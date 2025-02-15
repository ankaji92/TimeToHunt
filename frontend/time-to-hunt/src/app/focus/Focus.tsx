import * as React from 'react';
import { Box, Paper, Typography, LinearProgress, Button, ButtonGroup } from '@mui/material';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckIcon from '@mui/icons-material/Check';
import { gameApi } from '@/services/api/resources/game';
import { Game, GameStatus } from '@/types/game';

dayjs.extend(duration);

interface FocusProps {
  onStatusChange: (gameId: number, newStatus: GameStatus) => void;
}

export default function Focus({ onStatusChange }: FocusProps) {
  const [activeGame, setActiveGame] = React.useState<Game | null>(null);
  const [remainingTime, setRemainingTime] = React.useState<string>('Ready to start');
  const [progress, setProgress] = React.useState<number>(0);

  const fetchActiveGame = async () => {
    try {
      const data = await gameApi.getActive();
      setActiveGame(data);
    } catch (error) {
      console.error('Error fetching active game:', error);
      setActiveGame(null);
    }
  };

  React.useEffect(() => {
    fetchActiveGame();
  }, []);

  React.useEffect(() => {
    if (!activeGame || activeGame.status !== 'HUNTING') return;

    const startTime = dayjs(activeGame.hunt_start_time);
    const [hours, minutes, seconds] = activeGame.estimated_hunting_time?.split(':').map(Number) ?? [0, 0, 0];
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
      const data = await gameApi.update(activeGame.id, {
        status: newStatus as GameStatus,
      });

      onStatusChange(activeGame.id, newStatus as GameStatus);
      fetchActiveGame();  // Re-fetch the active game
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  return (
    activeGame ? 
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          {activeGame.species_title}
        </Typography>
        
        {/* 残り時間の表示 */}
        <Typography 
          variant="h4" 
          align="center" 
          sx={{ mb: 2 }}
        >
          {remainingTime || 'Ready to start'}
        </Typography>

        {/* 進捗バー */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
              }
            }}
          />
        </Box>

        {/* アクションボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ButtonGroup variant="contained">
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={() => handleStatusChange('HUNTING')}
              disabled={activeGame.status === 'HUNTING'}
            >
              Start
            </Button>
            <Button
              startIcon={<PauseIcon />}
              onClick={() => handleStatusChange('PENDING')}
              disabled={activeGame.status === 'PENDING'}
            >
              Pause
            </Button>
            <Button
              startIcon={<CheckIcon />}
              onClick={() => handleStatusChange('CAPTURED')}
              disabled={activeGame.status === 'CAPTURED'}
            >
              Complete
            </Button>
            <Button
              color="error"
              onClick={() => handleStatusChange('ESCAPED')}
              disabled={activeGame.status === 'ESCAPED'}
            >
              Give Up
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>
    </Box>
    :
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5">
        No game currently in focus
      </Typography>
    </Box>
  );
} 