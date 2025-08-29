import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const users = [
    {
        id: 1,
        username: 'user1',
        password: 'password1',
        nickname: 'nick1'
    },
    {
        id: 2,
        username: 'user2',
        password: 'password2',
        nickname: 'nick2'
    }
]