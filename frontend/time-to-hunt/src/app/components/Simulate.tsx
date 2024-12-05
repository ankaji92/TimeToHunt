import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import dayjs from 'dayjs';
import { Game } from '@/app/types/game';

interface SimulateProps {
  selectedDate: Date;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  game?: Game;
  isConflict: boolean;
}

export default function Simulate({ selectedDate }: SimulateProps) {
  const [games, setGames] = React.useState<Game[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);

  // 指定された日付のゲームを取得
  React.useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/games/');
        if (response.ok) {
          const allGames = await response.json();
          const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
          
          // 選択された日付のゲームをフィルタリング
          const filteredGames = allGames.filter((game: Game) => 
            dayjs(game.hunt_start_time).format('YYYY-MM-DD') === selectedDateStr
          );
          
          setGames(filteredGames);
          analyzeSchedule(filteredGames);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, [selectedDate]);

  // スケジュールの分析
  const analyzeSchedule = (games: Game[]) => {
    const slots: TimeSlot[] = [];
    const sortedGames = [...games].sort((a, b) => 
      dayjs(a.hunt_start_time).valueOf() - dayjs(b.hunt_start_time).valueOf()
    );

    sortedGames.forEach((game, index) => {
      const startTime = dayjs(game.hunt_start_time);
      const duration = dayjs.duration(game.estimated_hunting_time);
      const endTime = startTime.add(duration);

      // 時間の重複チェック
      const isConflict = sortedGames.some((otherGame, otherIndex) => {
        if (index === otherIndex) return false;
        
        const otherStart = dayjs(otherGame.hunt_start_time);
        const otherDuration = dayjs.duration(otherGame.estimated_hunting_time);
        const otherEnd = otherStart.add(otherDuration);

        return (
          (startTime.isBefore(otherEnd) && endTime.isAfter(otherStart)) ||
          (otherStart.isBefore(endTime) && otherEnd.isAfter(startTime))
        );
      });

      slots.push({
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        game: game,
        isConflict
      });
    });

    setTimeSlots(slots);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 936, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        {dayjs(selectedDate).format('YYYY年MM月DD日')}のスケジュール分析
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>時間</TableCell>
              <TableCell>ゲーム</TableCell>
              <TableCell>予定時間</TableCell>
              <TableCell>状態</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slot, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  backgroundColor: slot.isConflict ? 'error.light' : 'inherit'
                }}
              >
                <TableCell>
                  {slot.startTime} - {slot.endTime}
                </TableCell>
                <TableCell>{slot.game?.title}</TableCell>
                <TableCell>{slot.game?.estimated_hunting_time}</TableCell>
                <TableCell>
                  {slot.isConflict ? (
                    <Chip 
                      label="時間重複" 
                      color="error" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      label="OK" 
                      color="success" 
                      size="small" 
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {timeSlots.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography color="text.secondary">
            この日の予定はありません
          </Typography>
        </Box>
      )}
    </Paper>
  );
}