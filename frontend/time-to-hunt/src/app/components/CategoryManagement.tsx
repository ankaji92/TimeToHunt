import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryDialog from './CategoryDialog';
import { Box, Typography } from '@mui/material';

export default function CategoryManagement() {
  const [categories, setCategories] = React.useState<GameCategory[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<GameCategory | null>(null);

  React.useEffect(() => {
    fetch('http://localhost:8000/api/categories/')
      .then(response => response.json())
      .then(data => setCategories(data));
  }, []);

  const handleSubmit = async (categoryData: any) => {
    const url = editingCategory 
      ? `http://localhost:8000/api/categories/${editingCategory.id}/`
      : 'http://localhost:8000/api/categories/';
    
    try {
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingCategory) {
          setCategories(categories.map(cat => 
            cat.id === editingCategory.id ? data : cat
          ));
        } else {
          setCategories([...categories, data]);
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/categories/${id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== id));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <Paper sx={{ maxWidth: 936, margin: 'auto', overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5">カテゴリー管理</Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            setEditingCategory(null);
            setOpenDialog(true);
          }}
        >
          新規カテゴリー
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>カテゴリー名</TableCell>
              <TableCell>説明</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => {
                    setEditingCategory(category);
                    setOpenDialog(true);
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CategoryDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        editingCategory={editingCategory}
      />
    </Paper>
  );
} 