import { get, set } from 'idb-keyval';

export const saveAvatar = async (name: string, base64Image: string) => {
  await set(`avatar_${name}`, base64Image);
};

export const getAvatar = async (name: string): Promise<string | undefined> => {
  return await get(`avatar_${name}`);
};
