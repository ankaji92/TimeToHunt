import * as React from 'react';
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import { Game } from '../../types/game';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface GameRowProps {
  game: Game;
  games: Game[];
  level: number;
  onStart: (id: number) => void;
  onPause: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

function GameRow({ game, games, level, onStart, onPause, onComplete, onDelete }: GameRowProps) {
  const [open, setOpen] = React.useState(false);
  const [childGames, setChildGames] = React.useState<Game[]>([]);

  React.useEffect(() => {
    setChildGames(games.filter((g) => g.parent_game === game.id));
  }, [games, game]);

  return (
    <>
      <TableRow>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: level * 4 }}>
            {childGames.length > 0 && (
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
            )}
            {!childGames.length && <Box sx={{ width: 28 }} />}
            {game.species_title}
          </Box>
        </TableCell>
        <TableCell>{game.status}</TableCell>
        <TableCell>{game.estimated_hunting_time}</TableCell>
        <TableCell>{game.actual_hunting_time ? game.actual_hunting_time : '-'}</TableCell>
        <TableCell>{game.deadline ? dayjs(game.deadline).format('HH:mm:ss') : '-'}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(game.is_leaf_game && game.status === 'NOT_STARTED' || game.status === 'PENDING') && (
              <Tooltip title="Start">
                <IconButton onClick={() => onStart(game.id)}>
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
            )}
            {(game.is_leaf_game && game.status === 'HUNTING') && (
              <>
                <Tooltip title="Pause">
                  <IconButton onClick={() => onPause(game.id)}>
                    <PauseIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Complete">
                  <IconButton onClick={() => onComplete(game.id)}>
                    <StopIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Delete">
              <IconButton onClick={() => onDelete(game.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      {open && childGames.map((cg) => (
        <GameRow
          key={cg.id}
          game={cg}
          games={games}
          level={level + 1}
          onStart={onStart}
          onPause={onPause}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

interface SimulateProps {
  selectedDate: Date;
}

export default function Simulate({ selectedDate }: SimulateProps) {
  const [games, setGames] = React.useState<Game[]>([]);
  const [deleteGameId, setDeleteGameId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const date = dayjs(selectedDate).format('YYYY-MM-DD');
    fetch(`http://localhost:8000/api/games/?date=${date}`)
      .then(response => response.json())
      .then(data => setGames(data));
  }, [selectedDate]);

  const handleStart = async (gameId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/games/${gameId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'HUNTING',
        }),
      });
      
      if (response.ok) {
        const updatedGame = await response.json();
        setGames(games.map(g => g.id === gameId ? updatedGame : g));
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handlePause = async (gameId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/games/${gameId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PENDING',
        }),
      });

      if (response.ok) {
        const updatedGame = await response.json();
        setGames(games.map(g => g.id === gameId ? updatedGame : g));
      }
    } catch (error) {
      console.error('Error pausing game:', error);
    }
  };

  const handleComplete = async (gameId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/games/${gameId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CAPTURED',
        }),
      });

      if (response.ok) {
        const updatedGame = await response.json();
        setGames(games.map(g => g.id === gameId ? updatedGame : g));
      }
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  const handleDelete = async (gameId: number) => {
    setDeleteGameId(gameId);
  };

  const confirmDelete = async () => {
    if (!deleteGameId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/games/${deleteGameId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGames(games.filter(g => g.id !== deleteGameId));
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
    setDeleteGameId(null);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Species</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Estimated Time</TableCell>
              <TableCell>Actual Time</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games
              .filter((g) => g.parent_game === null)
              .map((g) => (
                <GameRow
                  key={g.id}
                  game={g}
                  games={games}
                  level={0}
                  onStart={handleStart}
                  onPause={handlePause}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteGameId !== null}
        onClose={() => setDeleteGameId(null)}
      >
        <DialogTitle>Delete Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this game? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGameId(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}