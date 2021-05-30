export interface IFilePart {
  chunk: Blob;
  size: number;
  filename?: string;
  chunkName?: string;
  loaded?: number;  // 已经上传的字节数
  percent?: number; // 已经上传的百分比
  xhr?: XMLHttpRequest;
}

export interface IUploadedFile {
  filename: string;
  size: number;
}
