export type SubjectType = 'General' | 'Maths' | 'Zoology' | 'Botany';

export interface ExamFile {
  id: string;
  file: File;
  name: string;
  subject: SubjectType;
  data?: any[];
}

export interface RawRecord {
  NAME: string;
  RIGHT: number;
  WRONG: number;
}

export interface ProcessedRecord {
  examId: string;
  rawName: string;
  canonicalName: string;
  right: number;
  wrong: number;
  score: number;
}

export interface StudentState {
  canonicalName: string;
  scores: number[];
  totalExamsAttended: number;
  lastAttendedExamIndex: number;
  hatTricks: number;
  consecutiveTop20: number;
  currentAverage: number;
}

export interface Top20Entry extends StudentState {
  rank: number;
  status: 'added' | 'removed' | 'same';
}

export interface DayResult {
  examId: string;
  examName: string;
  top20: Top20Entry[];
  removed: Top20Entry[]; // Students who were in top 20 yesterday but not today
}
