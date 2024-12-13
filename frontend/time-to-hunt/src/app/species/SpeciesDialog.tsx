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
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Species, SpeciesUpdate } from '@/types/species';
import { Genus } from '@/types/genus';
import GenusDialog from './GenusDialog';

interface SpeciesDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (speciesData: any) => void;
  defaultGenusId: number | null;
  editingSpecies?: Species | null;
  parentSpecies?: Species | null;
  genera: Genus[];
  onGeneraChange: (genera: Genus[]) => void;
}

export default function SpeciesDialog({
  open,
  onClose,
  onSubmit,
  defaultGenusId,
  editingSpecies,
  parentSpecies,
  genera,
  onGeneraChange,
}: SpeciesDialogProps) {
  const [speciesData, setSpeciesData] = React.useState<SpeciesUpdate>({
    id: editingSpecies?.id || undefined,
    title: '',
    description: '',
    genus: defaultGenusId || undefined,
    priority: 3,
    estimated_hunting_time: '01:00:00',
    parent_species: editingSpecies?.parent_species || undefined,
  });

  const [openGenusDialog, setOpenGenusDialog] = React.useState(false);

  // 編集時のデータ初期化
  React.useEffect(() => {
    if (editingSpecies) {
      setSpeciesData({
        id: editingSpecies.id,
        title: editingSpecies.title,
        description: editingSpecies.description || '',
        genus: editingSpecies.genus,
        priority: editingSpecies.priority,
        estimated_hunting_time: editingSpecies.estimated_hunting_time,
        parent_species: editingSpecies.parent_species ||undefined,
      });
    } else {
      // 新規作成時は初期値にリセット
      setSpeciesData({
        id: undefined,
        title: '',
        description: '',
        genus: defaultGenusId || undefined,
        priority: 3,
        estimated_hunting_time: '01:00:00',
        parent_species: parentSpecies?.id || undefined,
      });
    }
  }, [editingSpecies, defaultGenusId]);

  // parentSpeciesのgenusIdを使用するように更新
  React.useEffect(() => {
    if (parentSpecies) {
      setSpeciesData(prev => ({
        ...prev,
        genus: parentSpecies.genus
      }));
    }
  }, [parentSpecies]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSpecies ? 'Edit Species' : 'Add New Species'}
        </DialogTitle>
        <DialogContent>
          {parentSpecies && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Parent Species: {parentSpecies.title}
              </Typography>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={speciesData.title}
            onChange={(e) => setSpeciesData({ ...speciesData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={speciesData.description}
            onChange={(e) => setSpeciesData({ ...speciesData, description: e.target.value })}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Genus</InputLabel>
              <Select
                value={speciesData.genus}
                onChange={(e) => setSpeciesData({ ...speciesData, genus: Number(e.target.value) })}
                disabled={!!parentSpecies}
              >
                {genera.map((genus) => (
                  <MenuItem key={genus.id} value={genus.id}>
                    {genus.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => setOpenGenusDialog(true)}
              startIcon={<AddIcon />}
              sx={{ 
                height: '56px',
                whiteSpace: 'nowrap',
                minWidth: 'auto'
              }}
              disabled={!!parentSpecies}
            >
              Add Genus
            </Button>
          </Box>
          <TextField
            margin="dense"
            label="Priority"
            type="number"
            fullWidth
            value={speciesData.priority}
            onChange={(e) => setSpeciesData({ ...speciesData, priority: Number(e.target.value) })}
            inputProps={{ min: 1, max: 5 }}
          />
          <TextField
            margin="dense"
            label="Estimated Time (HH:MM:SS)"
            fullWidth
            value={speciesData.estimated_hunting_time}
            onChange={(e) => setSpeciesData({ ...speciesData, estimated_hunting_time: e.target.value })}
            placeholder="01:00:00"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(speciesData)} variant="contained">
            {editingSpecies ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <GenusDialog
        open={openGenusDialog}
        onClose={() => setOpenGenusDialog(false)}
        onGeneraChange={onGeneraChange}
        genera={genera}
        editingGenusId={null}
      />
    </>
  );
} 