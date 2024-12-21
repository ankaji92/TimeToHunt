export interface Game {
    id: number;
    species: number;
    species_title?: string;
    species_parent_species?: number;
    parent_game?: number;
    hunt_start_time: string;
    actual_hunting_time?: string;
    status: GameStatus;
    is_active: boolean;
    is_leaf_game: boolean;
    deadline?: string;
    estimated_hunting_time?: string;
    remaining_time?: string;
    is_expired?: boolean;
    created_at: string;
    updated_at: string;
}

export interface GameCreate {
    species: number;
}

export type GameUpdate = Partial<Game>;

export type GameStatus = 'NOT_STARTED' | 'HUNTING' | 'PENDING' | 'CAPTURED' | 'ESCAPED';