import { IFilePart } from 'types/index';

const DEFAULT_SIZE = 1024 * 1024 * 100;

export const createChunks = (file: File): IFilePart[] => {
  let current = 0;
  const partList: IFilePart[] = [];
  while (current < file.size) {
    const chunk: Blob = file.slice(current, current + DEFAULT_SIZE);
    partList.push({ chunk, size: chunk.size });
    current += DEFAULT_SIZE;
  }
  return partList;
}
