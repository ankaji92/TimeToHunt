import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Genus } from '@/types/genus';
import { genusApi } from '@/services/api/resources/genus';

interface GenusDialogProps {
  open: boolean;
  onClose: () => void;
  onGeneraChange: (genera: Genus[]) => void;
  genera: Genus[];
  editingGenusId: number | null;
}

export default function GenusDialog({ open, onClose, onGeneraChange, genera, editingGenusId }: GenusDialogProps) {
  const [genusData, setGenusData] = React.useState({
    name: '',
    description: '',
  });

  React.useEffect(() => {
    if (editingGenusId) {
      const editingGenus = genera.find(genus => genus.id === editingGenusId);
      if (editingGenus) {
        setGenusData({
          name: editingGenus.name,
        description: editingGenus.description,
      });
      }
    }
  }, [editingGenusId]);

  const handleSubmit = async (genusData: any) => {
    try {
      if (editingGenusId) {
        await genusApi.update(editingGenusId, genusData);
      } else {
        await genusApi.create(genusData);
      }
      const updatedGenera = await genusApi.getAll();
      onGeneraChange(updatedGenera);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingGenusId ? 'Edit Genus' : 'Add New Genus'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Genus Name"
          fullWidth
          value={genusData.name}
          onChange={(e) => setGenusData({ ...genusData, name: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={genusData.description}
          onChange={(e) => setGenusData({ ...genusData, description: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => handleSubmit(genusData)} variant="contained">
          {editingGenusId ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 