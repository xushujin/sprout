import type { AvatarConfig } from './avatar';

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'student';
  points?: number;
  avatar?: AvatarConfig | null;
  owned_items?: string[];
  /** Unlocked paid cosmetics, as `hair:curly` / `skin:deep` / `outfit:dress`. */
  unlocked_styles?: string[];
}

export interface ScoreEvent {
  id: string;
  words_learned: number;
  words_reviewed: number;
  correct_count: number;
  total_count: number;
  mistakes_corrected: number;
  points_earned: number;
}

export interface Leaderboard {
  range?: 'week' | 'all';
  week_start?: string;
  generated_at: number | null;
  entries: {
    display_name: string;
    points: number;
    rounds: number;
    // Optional so snapshots written before the sunflower release still render.
    lifetime_points?: number;
    // Optional so snapshots written before leaderboard avatars still render.
    avatar?: AvatarConfig | null;
  }[];
}

export interface Student extends User {
  created_at: number;
  rounds: number;
  words_learned: number;
  words_reviewed: number;
  correct_count: number;
  total_count: number;
  points: number;
  earned_points: number;
  week_rounds: number;
  week_points: number;
  last_active: number | null;
}
