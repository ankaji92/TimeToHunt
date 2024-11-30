import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Game } from '@/app/types/game';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

interface NewGameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (gameData: any) => void;
  editingGame?: Game | null;
}

export default function NewGameDialog({ open, onClose, onSubmit, editingGame }: NewGameDialogProps) {
  const [gameData, setGameData] = React.useState({
    title: '',
    description: '',
    priority: 1,
    hunt_start_time: dayjs(),
    estimated_hunting_time: '01:00',
  });

  React.useEffect(() => {
    if (editingGame) {
      setGameData({
        title: editingGame.title,
        description: editingGame.description,
        priority: editingGame.priority,
        hunt_start_time: dayjs(editingGame.hunt_start_time),
        estimated_hunting_time: editingGame.estimated_hunting_time,
      });
    }
  }, [editingGame]);

  const handleSubmit = () => {
    const [hours, minutes] = gameData.estimated_hunting_time.split(':').map(Number);
    const formattedData = {
      ...gameData,
      hunt_start_time: gameData.hunt_start_time.format(),
      estimated_hunting_time: `PT${hours}H${minutes}M`,
      status: 'NOT_STARTED'
    };
    onSubmit(formattedData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新規ゲームの追加</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="タイトル"
          fullWidth
          value={gameData.title}
          onChange={(e) => setGameData({ ...gameData, title: e.target.value })}
        />
        <TextField
          margin="dense"
          label="説明"
          fullWidth
          multiline
          rows={4}
          value={gameData.description}
          onChange={(e) => setGameData({ ...gameData, description: e.target.value })}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>優先度</InputLabel>
          <Select
            value={gameData.priority}
            onChange={(e) => setGameData({ ...gameData, priority: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((priority) => (
              <MenuItem key={priority} value={priority}>
                {priority}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
          <DateTimePicker
            label="狩猟開始時間"
            value={gameData.hunt_start_time}
            onChange={(newValue) => setGameData({ ...gameData, hunt_start_time: newValue ?? gameData.hunt_start_time })}
            sx={{ mt: 2, width: '100%' }}
          />
        </LocalizationProvider>
        <TextField
          margin="dense"
          label="予定狩猟時間（HH:MM）"
          fullWidth
          value={gameData.estimated_hunting_time}
          onChange={(e) => setGameData({ ...gameData, estimated_hunting_time: e.target.value })}
          placeholder="01:00"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained">
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
} 