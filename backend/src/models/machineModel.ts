export interface Machine {
    id: string; // UUID or string identifier
    name: string;
    os: 'Linux' | 'Windows' | 'Other';
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane';
    points: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}