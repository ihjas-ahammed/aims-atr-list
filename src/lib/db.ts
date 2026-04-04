import { get, set, del } from 'idb-keyval';
import { ExamFile } from '../types';

export const saveAvatar = async (name: string, base64Image: string) => {
  await set(`avatar_${name}`, base64Image);
};

export const getAvatar = async (name: string): Promise<string | undefined> => {
  return await get(`avatar_${name}`);
};

export const removeAvatar = async (name: string) => {
  await del(`avatar_${name}`);
};

export const saveExams = async (exams: ExamFile[]) => {
  await set('aims_exams', exams);
};

export const getExams = async (): Promise<ExamFile[]> => {
  return (await get('aims_exams')) || [];
};
