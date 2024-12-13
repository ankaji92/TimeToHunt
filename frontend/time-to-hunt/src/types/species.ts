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

export interface SpeciesCreate {
    title: string;
    description: string;
    genus: number;
    parent_species?: number;
    priority: number;
    estimated_hunting_time: string;
}

export type SpeciesUpdate = Partial<Species>;
