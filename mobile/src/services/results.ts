import { apiGet, apiPut } from './api';

export type CourseOverride = {
  grade?: number;
  status?: 'passed' | 'failed' | 'in-progress';
  name?: string;
  credit?: number;
};

export type OverrideData = Record<string, Record<string, CourseOverride>>;

export async function fetchResults(userId: string): Promise<OverrideData> {
  const res = await apiGet<{ data?: OverrideData }>(`/api/results?userId=${encodeURIComponent(userId)}`);
  return res?.data || {};
}

export async function saveResults(userId: string, data: OverrideData): Promise<void> {
  await apiPut('/api/results', { userId, data });
}

export async function saveSpecialization(userId: string, specialization: 'dev' | 'design'): Promise<void> {
  await apiPut('/api/results', { userId, specialization });
}

export async function fetchResultsMeta(userId: string): Promise<{
  data: OverrideData;
  specialization?: 'dev' | 'design';
  stats?: any;
}> {
  const res = await apiGet<{
    data?: OverrideData;
    specialization?: 'dev' | 'design';
    stats?: any;
  }>(`/api/results?userId=${encodeURIComponent(userId)}`);
  
  return {
    data: res?.data || {},
    specialization: res?.specialization,
    stats: res?.stats,
  };
}

