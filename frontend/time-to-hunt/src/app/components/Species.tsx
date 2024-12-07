import * as React from 'react';
import {
  Paper,
  AppBar,
  Tabs,
  Tab,
  Toolbar,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  Tooltip,
  Collapse,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { Species, Genus, Game } from '../types/game';
import SpeciesDialog from './SpeciesDialog';

interface SpeciesRowProps {
  species: Species;
  specieses: Species[];
  level: number;
  onEncounter: (id: number) => void;
  onAnalyze: (species: Species) => void;
  onDelete: (id: number) => void;
  onEdit: (species: Species) => void;
}

// 再帰的に表示する行コンポーネント
function SpeciesRow({ species, specieses, level, onEncounter, onAnalyze, onDelete, onEdit }: SpeciesRowProps) {
  const [open, setOpen] = React.useState(false);
  const [childSpecieses, setChildSpecieses] = React.useState<Species[]>([]);

  // 子Speciesを取得
  React.useEffect(() => {
    setChildSpecieses(specieses.filter((sp) => sp.parent_species === species.id));
  }, [specieses]);

  return (
    <>
      <TableRow>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: level * 4 }}>
            {childSpecieses.length > 0 && (
              <IconButton
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            )}
            {!childSpecieses.length && <Box sx={{ width: 28 }} />}
            {species.title}
          </Box>
        </TableCell>
        <TableCell>{species.genus_name}</TableCell>
        <TableCell>{species.priority}</TableCell>
        <TableCell>{species.estimated_hunting_time}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Encounter (Start New Game)">
              <IconButton onClick={() => onEncounter(species.id)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Analyze (Add Sub-species)">
              <IconButton onClick={() => onAnalyze(species)}>
                <AccountTreeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton onClick={() => onEdit(species)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => onDelete(species.id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      {open && childSpecieses.map((csp) => (
        <SpeciesRow
          key={csp.id}
          species={csp}
          specieses={specieses}
          level={level + 1}
          onEncounter={onEncounter}
          onAnalyze={onAnalyze}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}

export default function SpeciesList() {
  const [specieses, setSpecieses] = React.useState<Species[]>([]);
  const [genera, setGenera] = React.useState<Genus[]>([]);
  const [openNewSpecies, setOpenNewSpecies] = React.useState(false);
  const [editingSpecies, setEditingSpecies] = React.useState<Species | null>(null);
  const [selectedGenusId, setSelectedGenusId] = React.useState<number | null>(null);
  const [parentSpecies, setParentSpecies] = React.useState<Species | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [encounterSpecies, setEncounterSpecies] = React.useState<Species | null>(null);
  const [deleteGenusId, setDeleteGenusId] = React.useState<number | null>(null);

  // ジャンル一覧の取得
  React.useEffect(() => {
    fetch('http://localhost:8000/api/genera/')
      .then(response => response.json())
      .then(data => setGenera(data));
  }, []);

  // Species一覧の取得
  React.useEffect(() => {
    const url = selectedGenusId 
      ? `http://localhost:8000/api/species/?genus=${selectedGenusId}`
      : 'http://localhost:8000/api/species/';
    
    fetch(url)
      .then(response => response.json())
      .then(data => setSpecieses(data));
  }, [selectedGenusId]);

  // 遭遇（新規ゲームインスタンスの作成）
  const handleEncounter = async (speciesId: number) => {
    try {
      const response = await fetch('http://localhost:8000/api/games/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          species: speciesId,
          status: 'NOT_STARTED',
          hunt_start_time: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        const targetSpecies = specieses.find(sp => sp.id === speciesId);
        setEncounterSpecies(targetSpecies || null);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error creating new encounter:', error);
    }
  };

  const refreshSpecieses = () => {
    const url = selectedGenusId 
      ? `http://localhost:8000/api/species/?genus=${selectedGenusId}`
      : 'http://localhost:8000/api/species/';

    fetch(url)
      .then(response => response.json())
      .then(data => setSpecieses(data));
  };

  // 分析（子Species追加）ハンドラー
  const handleAnalyze = (species: Species) => {
    setParentSpecies(species);
    setOpenNewSpecies(true);
  };

  const handleDelete = async (speciesId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/species/${speciesId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        refreshSpecieses();
      }
    } catch (error) {
      console.error('Error deleting species:', error);
    }
  };

  const handleUpdateSpecies = async (speciesData: Species) => {
    try {
      const url = speciesData.id 
        ? `http://localhost:8000/api/species/${speciesData.id}/`
        : 'http://localhost:8000/api/species/';

      const response = await fetch(url, {
        method: speciesData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...speciesData,
          parent_species: parentSpecies?.id,
        }),
      });

      if (response.ok) {
        refreshSpecieses();
        setOpenNewSpecies(false);
        setParentSpecies(null);
      }
    } catch (error) {
      console.error('Error adding species:', error);
    }
  };

  // 編集ハンドラーを追加
  const handleEdit = (species: Species) => {
    setEditingSpecies(species);
    setParentSpecies(specieses.find(sp => sp.id === species.parent_species) || null);
    setOpenNewSpecies(true);
  };

  // Genus削除のハンドラーを追加
  const handleDeleteGenus = async (genusId: number) => {
    setDeleteGenusId(genusId);
  };

  const confirmDeleteGenus = async () => {
    if (deleteGenusId === null) return;

    try {
      const response = await fetch(`http://localhost:8000/api/genera/${deleteGenusId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGenera(genera.filter(g => g.id !== deleteGenusId));
        if (selectedGenusId === deleteGenusId) {
          setSelectedGenusId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting genus:', error);
    }
    setDeleteGenusId(null);
  };

  return (
    <>
      <Paper sx={{ maxWidth: 936, margin: 'auto', overflow: 'hidden' }}>
        <AppBar position="static" color="default">
          <Tabs 
            value={selectedGenusId} 
            onChange={(_, value) => setSelectedGenusId(value)}
          >
            <Tab label="All" value={null} />
            {genera.map((genus) => (
              <Box
                key={genus.id}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  '& .delete-button': {
                    display: 'none'
                  },
                  '&:hover .delete-button': {
                    display: 'block'
                  }
                }}
              >
                <Tab 
                  label={genus.name}
                  value={genus.id}
                />
                <IconButton
                  size="small"
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGenus(genus.id);
                  }}
                  sx={{
                    m: 0,
                    p: 0,
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Tabs>
        </AppBar>
        <Toolbar>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewSpecies(true)}
            sx={{ mr: 1 }}
          >
            Add New Species
          </Button>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Genus</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Estimated Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {specieses
                .filter((sp) => sp.parent_species === null)
                .map((sp) => (
                  <SpeciesRow
                    key={sp.id}
                    species={sp}
                    specieses={specieses}
                    level={0}
                    onEncounter={handleEncounter}
                    onAnalyze={handleAnalyze}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <SpeciesDialog
          open={openNewSpecies}
          onClose={() => {
            setOpenNewSpecies(false);
            setEditingSpecies(null);
            setParentSpecies(null);
          }}
          onSubmit={handleUpdateSpecies}
          defaultGenusId={selectedGenusId}
          editingSpecies={editingSpecies}
          parentSpecies={parentSpecies}
          genera={genera}
          onGeneraChange={setGenera}
        />
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {encounterSpecies && `"${encounterSpecies.title}" has been added to your schedule!`}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteGenusId !== null}
        onClose={() => setDeleteGenusId(null)}
      >
        <DialogTitle>Delete Genus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this genus? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGenusId(null)}>Cancel</Button>
          <Button onClick={confirmDeleteGenus} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}