export interface Genus {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Species {
    id: number;
    title: string;
    description: string;
    genus: number;
    genus_name: string;
    parent_species?: number;
    priority: number;
    estimated_hunting_time: string;
    is_leaf_species: boolean;
    created_at: string;
    updated_at: string;
}

export interface Game {
    id: number;
    species?: number;
    species_title?: string;
    species_parent_species?: number;
    parent_game?: number;
    hunt_start_time: string;
    actual_hunting_time?: string;
    status: 'NOT_STARTED' | 'HUNTING' | 'PENDING' | 'CAPTURED' | 'ESCAPED';
    is_active: boolean;
    deadline?: string;
    estimated_hunting_time: string;
    remaining_time?: string;
    is_expired?: boolean;
    created_at: string;
    updated_at: string;
}

export type GameStatus = Game['status'];

// Status descriptions for display
export const STATUS_LABELS = {
  'NOT_STARTED': 'Not Started',
  'HUNTING': 'Hunting',
  'PENDING': 'Pending',
  'CAPTURED': 'Captured',
  'ESCAPED': 'Escaped'
} as const;