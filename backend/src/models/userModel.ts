export interface User {
    id: string;
    username: string;
    password_hash: string; // Emphasize that we only store hashes, never plaintext
    role: 'admin' | 'pentester' | 'guest';
    clearance_level: number;
    created_at?: Date;
    last_login?: Date;
}

// A specific type for the data we actually send back to the frontend
export type UserProfileResponse = Omit<User, 'password_hash'>;