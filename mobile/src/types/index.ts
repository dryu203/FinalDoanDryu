// Common types used across the app

export type Specialization = 'dev' | 'design';

export type SemesterKey = string; // e.g., "HK1", "HK2"

export type CourseResult = {
  code: string;
  name: string;
  credit: number;
  grade?: number;
  status?: 'passed' | 'failed' | 'in-progress';
  countInGpa?: boolean;
  countInCredits?: boolean;
  category?: string;
};

