import { apiGet } from './api';

export type CourseData = {
  code: string;
  name: string;
  credit: number;
  countInGpa?: boolean;
  countInCredits?: boolean;
  category?: string;
};

export type SemesterData = {
  semester: string;
  courses: CourseData[];
};

export type ProgressData = {
  specialization: 'dev' | 'design';
  semesters: SemesterData[];
};

export type CurriculumDoc = {
  specialization: string;
  name: string;
  semesters: SemesterData[];
  requiredCredits?: number;
  totals?: {
    totalCreditsAll: number;
    totalCreditsCounted: number;
    totalGpaCredits: number;
  };
  breakdown?: Array<{
    semester: string;
    code: string;
    name: string;
    credit: number;
    countInCredits: boolean;
    countInGpa: boolean;
  }>;
};

export async function fetchCurriculum(spec: 'dev' | 'design'): Promise<ProgressData> {
  const data = await apiGet<CurriculumDoc>(`/api/curriculum/${encodeURIComponent(spec)}`);
  
  return {
    specialization: data.specialization as 'dev' | 'design',
    semesters: data.semesters.map((s) => ({
      semester: s.semester,
      courses: s.courses.map((c) => ({
        code: c.code,
        name: c.name,
        credit: c.credit,
        countInGpa: c.countInGpa !== false,
        countInCredits: c.countInCredits !== false,
        category: c.category,
      })),
    })),
  };
}

export async function fetchCurriculumDoc(spec: 'dev' | 'design'): Promise<CurriculumDoc> {
  return apiGet<CurriculumDoc>(`/api/curriculum/${encodeURIComponent(spec)}`);
}

