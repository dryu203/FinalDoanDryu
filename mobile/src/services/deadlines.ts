import { apiGet, apiPost, apiPut, apiDelete } from './api';

export type DeadlineStatus = 'upcoming' | 'ongoing' | 'overdue' | 'completed';

export type DeadlineDto = {
  _id: string;
  title: string;
  courseCode?: string;
  startAt?: string | null;
  endAt?: string | null;
  note?: string;
  isExam?: boolean;
  status: DeadlineStatus;
  createdAt: string;
  updatedAt: string;
};

export type DeadlineFilter = 'upcoming' | 'ongoing' | 'overdue' | 'completed' | 'incomplete';

export async function fetchDeadlines(userId: string, status?: DeadlineFilter): Promise<DeadlineDto[]> {
  const query = new URLSearchParams({ userId });
  if (status) query.set('status', status);
  const res = await apiGet<{ data?: DeadlineDto[] }>(`/api/deadlines?${query.toString()}`);
  return res?.data || [];
}

export async function createDeadline(
  userId: string,
  payload: Partial<DeadlineDto>
): Promise<DeadlineDto> {
  const res = await apiPost<{ data: DeadlineDto }>('/api/deadlines', { userId, ...payload });
  return res.data;
}

export async function updateDeadline(
  userId: string,
  id: string,
  payload: Partial<DeadlineDto>
): Promise<DeadlineDto> {
  const res = await apiPut<{ data: DeadlineDto }>(`/api/deadlines/${encodeURIComponent(id)}`, {
    userId,
    ...payload,
  });
  return res.data;
}

export async function deleteDeadline(userId: string, id: string): Promise<void> {
  await apiDelete(`/api/deadlines/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`);
}

