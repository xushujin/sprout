export interface User {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'student';
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
  week_start: string;
  generated_at: number | null;
  entries: {
    display_name: string;
    points: number;
    rounds: number;
    // Optional so snapshots written before the sunflower release still render.
    lifetime_points?: number;
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
  week_rounds: number;
  week_points: number;
  last_active: number | null;
}
