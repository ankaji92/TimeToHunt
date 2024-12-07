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
  Chip,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { Game } from '@/app/types/game';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

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
  const [editingTime, setEditingTime] = React.useState<{ 
    index: number; 
    field: 'startTime' | 'endTime'; 
    value: string; 
  } | null>(null);

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
      const [hours, minutes] = game.estimated_hunting_time?.split(':').map(Number) || [0, 0];
      const estimatedDuration = dayjs.duration({ hours, minutes });
      const endTime = startTime.add(estimatedDuration);

      // 時間の重複チェック
      const isConflict = sortedGames.some((otherGame, otherIndex) => {
        if (index === otherIndex) return false;
        
        const otherStart = dayjs(otherGame.hunt_start_time);
        const [otherHours, otherMinutes] = otherGame.estimated_hunting_time?.split(':').map(Number) || [0, 0];
        const otherDuration = dayjs.duration({ hours: otherHours, minutes: otherMinutes });
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

  const handleTimeChange = async (index: number, field: 'startTime' | 'endTime', value: string) => {
    if (!timeSlots[index].game) return;

    const game = timeSlots[index].game!;
    const date = dayjs(selectedDate).format('YYYY-MM-DD');
    let updatedStartTime = game.hunt_start_time;
    let updatedDuration = game.estimated_hunting_time;

    if (field === 'startTime') {
      updatedStartTime = `${date} ${value}`;
    } else {
      const startHour = parseInt(timeSlots[index].startTime.split(':')[0]);
      const startMinute = parseInt(timeSlots[index].startTime.split(':')[1]);
      const endHour = parseInt(value.split(':')[0]);
      const endMinute = parseInt(value.split(':')[1]);
      
      const durationHours = endHour - startHour;
      const durationMinutes = endMinute - startMinute;
      updatedDuration = `${String(durationHours).padStart(2, '0')}:${String(durationMinutes).padStart(2, '0')}`;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/games/${game.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hunt_start_time: updatedStartTime,
          estimated_hunting_time: updatedDuration,
        }),
      });

      if (response.ok) {
        const updatedGame = await response.json();
        const updatedGames = games.map(g => g.id === game.id ? updatedGame : g);
        setGames(updatedGames);
        analyzeSchedule(updatedGames);
      }
    } catch (error) {
      console.error('Error updating game time:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 936, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Schedule for {dayjs(selectedDate).format('YYYY/MM/DD')}
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Game</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((slot, index) => (
              <TableRow 
                key={index}
                sx={{ backgroundColor: slot.isConflict ? 'error.light' : 'inherit' }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      value={editingTime?.index === index && editingTime.field === 'startTime' 
                        ? editingTime.value 
                        : slot.startTime}
                      onChange={(e) => setEditingTime({ 
                        index, 
                        field: 'startTime', 
                        value: e.target.value 
                      })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && editingTime) {
                          handleTimeChange(index, 'startTime', editingTime.value);
                          setEditingTime(null);
                        }
                      }}
                      onBlur={() => setEditingTime(null)}
                      sx={{ width: '80px' }}
                    />
                    {' - '}
                    <TextField
                      size="small"
                      value={editingTime?.index === index && editingTime.field === 'endTime' 
                        ? editingTime.value 
                        : slot.endTime}
                      onChange={(e) => setEditingTime({ 
                        index, 
                        field: 'endTime', 
                        value: e.target.value 
                      })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && editingTime) {
                          handleTimeChange(index, 'endTime', editingTime.value);
                          setEditingTime(null);
                        }
                      }}
                      onBlur={() => setEditingTime(null)}
                      sx={{ width: '80px' }}
                    />
                  </Box>
                </TableCell>
                <TableCell>{slot.game?.species_title}</TableCell>
                <TableCell>
                  {slot.isConflict ? (
                    <Chip label="Time Conflict" color="error" size="small" />
                  ) : (
                    <Chip label="OK" color="success" size="small" />
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
            No schedule for this day
          </Typography>
        </Box>
      )}
    </Paper>
  );
}