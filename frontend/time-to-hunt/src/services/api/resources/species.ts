import { apiClient } from '@/services/api/client';
import { SpeciesCreate, SpeciesUpdate } from '@/types/species';

export const speciesApi = {
  getAll: () => apiClient('/species/'),
  getByGenusId: (genusId: number) => apiClient(`/species/?genus=${genusId}`),
  create: (data: SpeciesCreate) => 
    apiClient('/species/', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (id: number, data: SpeciesUpdate) =>
    apiClient(`/species/${id}/`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  delete: (id: number) =>
    apiClient(`/species/${id}/`, { 
      method: 'DELETE' 
    }),
}; 
