import * as React from 'react';
import Drawer, { DrawerProps } from '@mui/material/Drawer';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import CategoryDialog from './CategoryDialog';
import { useRouter, usePathname } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import { GameCategory } from '@/app/types/game';

interface NavigatorProps extends Omit<DrawerProps, 'classes'> {
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

export default function Navigator({ selectedCategoryId, onCategorySelect, ...other }: NavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = React.useState<GameCategory[]>([]);
  const [openNewCategory, setOpenNewCategory] = React.useState(false);

  React.useEffect(() => {
    fetch('http://localhost:8000/api/categories/')
      .then(response => response.json())
      .then(data => setCategories(data));
  }, []);

  const handleCategorySelect = (categoryId: number | null) => {
    onCategorySelect(categoryId);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <Drawer variant="permanent" {...other}>
      <List disablePadding>
        <ListItem className="app-title">
          TimeToHunt
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => router.push('/')}>
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText>ホーム</ListItemText>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/focus')}
            selected={pathname === '/focus'}
          >
            <ListItemIcon><TimerIcon /></ListItemIcon>
            <ListItemText>フォーカスモード</ListItemText>
          </ListItemButton>
        </ListItem>
        <Box className="category-container">
          <ListItem sx={{ py: 2, px: 3 }}>
            <ListItemText>カテゴリー</ListItemText>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedCategoryId === null && pathname === '/'}
              onClick={() => handleCategorySelect(null)}
            >
              <ListItemIcon><DnsRoundedIcon /></ListItemIcon>
              <ListItemText>全てのゲーム</ListItemText>
            </ListItemButton>
          </ListItem>
          {categories.map((category) => (
            <ListItem disablePadding key={category.id}>
              <ListItemButton 
                selected={selectedCategoryId === category.id && pathname === '/'}
                onClick={() => handleCategorySelect(category.id)}
              >
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText>{category.name}</ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenNewCategory(true)}>
              <ListItemIcon><AddIcon /></ListItemIcon>
              <ListItemText>新規カテゴリー</ListItemText>
            </ListItemButton>
          </ListItem>
        </Box>
      </List>
      <CategoryDialog 
        open={openNewCategory}
        onClose={() => setOpenNewCategory(false)}
        onSubmit={async (categoryData) => {
          // カテゴリー追加の処理
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
    </Drawer>
  );
}