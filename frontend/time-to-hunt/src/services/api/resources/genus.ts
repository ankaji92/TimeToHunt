import { apiClient } from '@/services/api/client';
import { GenusCreate, GenusUpdate } from '@/types/genus';

export const genusApi = {
  getAll: () => apiClient('/genera/'),
  getByGenusId: (genusId: number) => apiClient(`/genera/?genus=${genusId}`),
  create: (data: GenusCreate) => 
    apiClient('/genera/', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (id: number, data: GenusUpdate) =>
    apiClient(`/genera/${id}/`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  delete: (id: number) =>
    apiClient(`/genera/${id}/`, { 
      method: 'DELETE' 
    }),
}; 
