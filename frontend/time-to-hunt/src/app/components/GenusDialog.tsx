import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Genus } from '@/app/types/game';

interface GenusDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (genusData: any) => void;
  editingGenus?: Genus | null;
}

export default function GenusDialog({ open, onClose, onSubmit, editingGenus }: GenusDialogProps) {
  const [genusData, setGenusData] = React.useState({
    name: '',
    description: '',
  });

  React.useEffect(() => {
    if (editingGenus) {
      setGenusData({
        name: editingGenus.name,
        description: editingGenus.description,
      });
    }
  }, [editingGenus]);

  const handleSubmit = () => {
    onSubmit(genusData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingGenus ? 'Edit Genre' : 'Add New Genre'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Genre Name"
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
        <Button onClick={handleSubmit} variant="contained">
          {editingGenus ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 