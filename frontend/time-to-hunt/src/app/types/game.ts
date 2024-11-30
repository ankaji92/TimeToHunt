export interface Game {
    id: number;
    title: string;
    description: string;
    category: number;
    parent_game?: number;
    
    // 時間関連
    hunt_start_time: string;
    estimated_hunting_time: string;
    actual_hunting_time?: string;
    remaining_time: string;
    deadline?: string;
    
    // ステータス関連
    status: 'NOT_STARTED' | 'HUNTING' | 'PENDING' | 'CAPTURED' | 'ESCAPED';
    priority: number;
    
    // フラグ
    is_active: boolean;
    is_leaf_game: boolean;
    is_expired: boolean;
    
    // メタデータ
    created_at: string;
    updated_at: string;
}

export interface GameCategory {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export type GameStatus = Game['status'];