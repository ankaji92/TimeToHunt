import * as React from 'react';
import {
  AppBar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GenusDialog from './GenusDialog';
import { Genus } from '@/types/game';

interface GeneraProps {
  genera: Genus[];
  selectedGenusId: number | null;
  onSelectGenus: (genusId: number | null) => void;
  onGeneraChange: (genera: Genus[]) => void;
}

export default function Genera({ 
  genera, 
  selectedGenusId, 
  onSelectGenus, 
  onGeneraChange 
}: GeneraProps) {
  const [deleteGenusId, setDeleteGenusId] = React.useState<number | null>(null);
  const [openNewGenus, setOpenNewGenus] = React.useState(false);
  const [editingGenusId, setEditingGenusId] = React.useState<number | null>(null);


  const confirmDeleteGenus = async () => {
    if (deleteGenusId === null) return;

    try {
      const response = await fetch(`http://localhost:8000/api/genera/${deleteGenusId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const updatedGenera = genera.filter(g => g.id !== deleteGenusId);
        onGeneraChange(updatedGenera);
        if (selectedGenusId === deleteGenusId) {
          onSelectGenus(null);
        }
      }
    } catch (error) {
      console.error('Error deleting genus:', error);
    }
    setDeleteGenusId(null);
  };


  return (
    <>
      <AppBar 
        position="static" 
        color="default"
        sx={{ 
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <Tabs 
          value={selectedGenusId} 
          onChange={(_, value) => onSelectGenus(value)}
          sx={{ flex: 1 }}
        >
          <Tab label="All" value={null} />
          {genera.map((genus) => (
            <Tab 
              label={genus.name}
              value={genus.id}
              key={genus.id}
            />
          ))}
        </Tabs>
        <Box sx={{ px: 2 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setEditingGenusId(null);
              setOpenNewGenus(true);
            }}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => setEditingGenusId(selectedGenusId)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => setDeleteGenusId(selectedGenusId)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </AppBar>

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

      <GenusDialog
        open={openNewGenus || editingGenusId !== null}
        onClose={() => {
          setOpenNewGenus(false);
          setEditingGenusId(null);
        }}
        onGeneraChange={onGeneraChange}
        genera={genera}
        editingGenusId={editingGenusId}
      />
    </>
  );
}
