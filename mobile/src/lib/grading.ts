export type Letter = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';

// Quy đổi điểm 10 → điểm chữ
export function letterFrom10(grade10: number | undefined): Letter | undefined {
  if (grade10 === undefined || grade10 === null) return undefined;
  if (grade10 >= 8.95) return 'A+';
  if (grade10 >= 8.45) return 'A';
  if (grade10 >= 7.95) return 'B+';
  if (grade10 >= 6.95) return 'B';
  if (grade10 >= 6.45) return 'C+';
  if (grade10 >= 5.45) return 'C';
  if (grade10 >= 4.95) return 'D+';
  if (grade10 >= 3.95) return 'D';
  return 'F';
}

// Quy đổi điểm 10 → thang 4
export function fourFrom10(grade10: number | undefined): number | undefined {
  if (grade10 === undefined || grade10 === null) return undefined;
  if (grade10 >= 8.95) return 4.0;
  if (grade10 >= 8.45) return 3.7;
  if (grade10 >= 7.95) return 3.5;
  if (grade10 >= 6.95) return 3.0;
  if (grade10 >= 6.45) return 2.5;
  if (grade10 >= 5.45) return 2.0;
  if (grade10 >= 4.95) return 1.5;
  if (grade10 >= 3.95) return 1.0;
  return 0.0;
}

// Quy đổi điểm chữ → 10 (dùng trung điểm của mỗi khoảng)
export const letterTo10: Record<Letter, number> = {
  'A+': 9.5,   // 8.95 – 10.0 → ~9.5
  A: 8.7,      // 8.45 – 8.94 → ~8.7
  'B+': 8.2,   // 7.95 – 8.44 → ~8.2
  B: 7.45,     // 6.95 – 7.94 → ~7.45
  'C+': 6.7,   // 6.45 – 6.94 → ~6.7
  C: 5.95,     // 5.45 – 6.44 → ~5.95
  'D+': 5.2,   // 4.95 – 5.44 → ~5.2
  D: 4.45,     // 3.95 – 4.94 → ~4.45
  F: 0,
};

