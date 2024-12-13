import { apiClient } from '@/services/api/client';
import { GameCreate, GameUpdate } from '@/types/game';

export const gameApi = {
  getAll: () => apiClient('/games/'),
  getByDate: (date: string) => apiClient(`/games/?date=${date}`),
  getActive: () => apiClient('/active_game/'),
  create: (data: GameCreate) => 
    apiClient('/games/', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (id: number, data: GameUpdate) =>
    apiClient(`/games/${id}/`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  delete: (id: number) =>
    apiClient(`/games/${id}/`, { 
      method: 'DELETE' 
    }),
};
