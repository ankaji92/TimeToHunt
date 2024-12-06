import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ja from 'dayjs/locale/ja';
import { Game, GameCategory } from '@/app/types/game';
import dayjs from 'dayjs';

dayjs.locale(ja);

interface NewGameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (gameData: any) => void;
  categories: GameCategory[];
  onNewCategory: () => void;
  editingGame?: Game | null;
  defaultCategoryId: number | null;
}

export default function NewGameDialog({ 
  open, 
  onClose, 
  onSubmit, 
  categories,
  onNewCategory,
  editingGame,
  defaultCategoryId
}: NewGameDialogProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [gameData, setGameData] = React.useState({
    title: '',
    description: '',
    category: defaultCategoryId || 0,
    priority: 3,
    hunt_start_time: dayjs(),
    estimated_hunting_time: '',
  });

  React.useEffect(() => {
    if (editingGame) {
      setGameData({
        title: editingGame.title,
        description: editingGame.description,
        category: editingGame.category,
        priority: editingGame.priority,
        hunt_start_time: dayjs(editingGame.hunt_start_time),
        estimated_hunting_time: editingGame.estimated_hunting_time,
      });
    }
  }, [editingGame]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingGame ? 'ゲームの編集' : '新規ゲーム'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="タイトル"
          fullWidth
          value={gameData.title}
          onChange={(e) => setGameData({ ...gameData, title: e.target.value })}
        />

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={gameData.category}
              onChange={(e) => setGameData({ ...gameData, category: Number(e.target.value) })}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={onNewCategory}
            startIcon={<AddIcon />}
            sx={{ 
              height: '56px',
              whiteSpace: 'nowrap',
              minWidth: 'auto'
            }}
          >
            新規カテゴリ
          </Button>
        </Box>

        <TextField
          margin="dense"
          label="予定所要時間（HH:MM）"
          fullWidth
          value={gameData.estimated_hunting_time}
          onChange={(e) => setGameData({ ...gameData, estimated_hunting_time: e.target.value})}
          placeholder="01:00"
        />

        <Accordion 
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          sx={{ mt: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="detail-settings-content"
            id="detail-settings-header"
          >
            <Typography>詳細設定</Typography>
          </AccordionSummary>
          <AccordionDetails>
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
                onChange={(newValue) => setGameData({ 
                  ...gameData, 
                  hunt_start_time: newValue || dayjs()
                })}
                sx={{ mt: 2, width: '100%' }}
              />
            </LocalizationProvider>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={() => onSubmit(gameData)} variant="contained">
          {editingGame ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 