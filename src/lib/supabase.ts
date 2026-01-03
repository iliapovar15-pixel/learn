import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number | null;
  total: number | null;
  created_at: string;
  updated_at: string;
};

export type UserSRS = {
  id: string;
  user_id: string;
  word_id: string;
  next_review: number;
  interval: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
};

export type UserDifficultWord = {
  id: string;
  user_id: string;
  word_id: string;
  error_count: number;
  last_error: number;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
};
