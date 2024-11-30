import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (categoryData: any) => void;
  editingCategory?: GameCategory | null;
}

export default function CategoryDialog({ open, onClose, onSubmit, editingCategory }: CategoryDialogProps) {
  const [categoryData, setCategoryData] = React.useState({
    name: '',
    description: '',
  });

  React.useEffect(() => {
    if (editingCategory) {
      setCategoryData({
        name: editingCategory.name,
        description: editingCategory.description,
      });
    }
  }, [editingCategory]);

  const handleSubmit = () => {
    onSubmit(categoryData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingCategory ? 'カテゴリーの編集' : '新規カテゴリーの追加'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="カテゴリー名"
          fullWidth
          value={categoryData.name}
          onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
        />
        <TextField
          margin="dense"
          label="説明"
          fullWidth
          multiline
          rows={4}
          value={categoryData.description}
          onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editingCategory ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 