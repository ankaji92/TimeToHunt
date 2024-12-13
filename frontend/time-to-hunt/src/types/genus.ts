export interface Genus {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface GenusCreate {
    name: string;
    description: string;
}

export type GenusUpdate = Partial<Genus>;
