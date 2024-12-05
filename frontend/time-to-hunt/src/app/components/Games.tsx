import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import NewGameDialog from './NewGameDialog';
import dayjs from 'dayjs';
import { Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Tabs, Tab } from '@mui/material';
import { Game, GameCategory } from '@/app/types/game';
import CategoryDialog from './CategoryDialog';

export default function Games() {
  const [games, setGames] = React.useState<Game[]>([]);
  const [openNewGame, setOpenNewGame] = React.useState(false);
  const [openNewCategory, setOpenNewCategory] = React.useState(false);
  const [editingGame, setEditingGame] = React.useState<Game | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);
  const [categories, setCategories] = React.useState<GameCategory[]>([]);
  const [selectedCategoryId, onCategorySelect] = React.useState<number | null>(null);

  const filteredGames = React.useMemo(() => {
    return games.filter(game => 
      selectedCategoryId === null || game.category === selectedCategoryId
    );
  }, [games, selectedCategoryId]);

  const handleNewGame = async (gameData: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/games/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });
      
      if (response.ok) {
        const newGame = await response.json();
        setGames([...games, newGame]);
      }
    } catch (error) {
      console.error('Error adding new game:', error);
    }
  };

  React.useEffect(() => {
    fetch('http://localhost:8000/api/games/')
      .then(response => response.json())
      .then(data => setGames(data));
  }, []);

  React.useEffect(() => {
    fetch('http://localhost:8000/api/categories/')
      .then(response => response.json())
      .then(data => setCategories(data));
  }, []);

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'NOT_STARTED': '未着手',
      'HUNTING': '狩猟中',
      'PENDING': '保留中',
      'CAPTURED': '捕獲完了',
      'ESCAPED': '見失う'
    };
    return statusMap[status] || status;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, game: Game) => {
    setAnchorEl(event.currentTarget);
    setSelectedGame(game);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGame(null);
  };

  const handleEdit = () => {
    if (selectedGame) {
      setEditingGame(selectedGame);
      setOpenNewGame(true);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedGame) {
      try {
        const response = await fetch(`http://localhost:8000/api/games/${selectedGame.id}/`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setGames(games.filter(game => game.id !== selectedGame.id));
        }
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
    handleMenuClose();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (selectedGame) {
      try {
        const response = await fetch(`http://localhost:8000/api/games/${selectedGame.id}/`, {
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
          const updatedGame = await response.json();
          setGames(games.map(game => 
            game.id === selectedGame.id ? updatedGame : game
          ));
        }
      } catch (error) {
        console.error('Error updating game status:', error);
      }
    }
    handleMenuClose();
  };

  return (
      <Box>
        <AppBar position="static" color="default">
          <Tabs 
            value={selectedCategoryId} 
            onChange={(_, value) => onCategorySelect(value)}
          >
            <Tab label="全て" value={null} />
            {categories.map((category) => (
              <Tab 
                key={category.id} 
                label={category.name} 
                value={category.id} 
              />
            ))}
          </Tabs>
        </AppBar>
        <Paper sx={{ mt: 3, overflow: 'hidden' }}>
          <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}
          >
            <Toolbar>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid>
                  <Button 
                    variant="contained" 
                    sx={{ mr: 1 }}
                    onClick={() => setOpenNewGame(true)}
                  >
                    新規ゲーム
                  </Button>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ゲーム名</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>優先度</TableCell>
                  <TableCell>狩猟開始時間</TableCell>
                  <TableCell>残り時間</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>{game.title}</TableCell>
                    <TableCell>{getStatusText(game.status)}</TableCell>
                    <TableCell>{game.priority}</TableCell>
                    <TableCell>{dayjs(game.hunt_start_time).format('YYYY/MM/DD HH:mm')}</TableCell>
                    <TableCell>{game.remaining_time}</TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuOpen(e, game)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon sx={{ mr: 1 }} /> 編集
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('HUNTING')}>
              <PlayArrowIcon sx={{ mr: 1 }} /> 狩猟開始
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('CAPTURED')}>
              <CheckIcon sx={{ mr: 1 }} /> 捕獲完了
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('ESCAPED')}>
              <StopIcon sx={{ mr: 1 }} /> 見失う
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon sx={{ mr: 1 }} /> 削除
            </MenuItem>
          </Menu>
          <NewGameDialog
            open={openNewGame}
            onClose={() => setOpenNewGame(false)}
            onSubmit={handleNewGame}
            categories={categories}
            onNewCategory={() => setOpenNewCategory(true)}
            defaultCategoryId={selectedCategoryId}
            editingGame={editingGame}
          />
          <CategoryDialog 
            open={openNewCategory}
            onClose={() => setOpenNewCategory(false)}
            onSubmit={async (categoryData) => {
              try {
                const response = await fetch('http://localhost:8000/api/categories/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(categoryData),
                });
                if (response.ok) {
                  const newCategory = await response.json();
                  setCategories([...categories, newCategory]);
                }
              } catch (error) {
                console.error('Error adding category:', error);
              }
              setOpenNewCategory(false);
            }}
          />
        </Paper>
      </Box>
  );
}