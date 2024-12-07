import * as React from 'react';
import Drawer, { DrawerProps } from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useRouter, usePathname } from 'next/navigation';
import { Box } from '@mui/material';

export default function Navigator({ ...other }: DrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      sx={{ width: 256, flexShrink: 0 }}
    >
      <Drawer variant="permanent" {...other}>
        <List disablePadding>
          <ListItem className="app-title">
            TimeToHunt
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              selected={pathname === '/'}
              onClick={() => router.push('/')}
            >
              <ListItemIcon><DnsRoundedIcon /></ListItemIcon>
              <ListItemText>Species</ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => router.push('/simulate')}
              selected={pathname === '/simulate'}
            >
              <ListItemIcon><AssessmentIcon /></ListItemIcon>
              <ListItemText>Simulate</ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => router.push('/focus')}
              selected={pathname === '/focus'}
            >
              <ListItemIcon><TimerIcon /></ListItemIcon>
              <ListItemText>Focus</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}