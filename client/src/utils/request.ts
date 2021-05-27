import { noop } from 'utils/tool';

export enum UPLOAD_STATUS {
  UPLOADING = `UPLOADING`,
  ERROR = `ERROR`,
  DONE = `DONE`
}

export interface IUploadFile {
  file?: File;
  percent?: number;
  url?: string;
  status?: UPLOAD_STATUS;
}

export interface IRequest {
  method: 'get' | 'post';
  url: string;
  data?: any;
  timeout?: number;
  onProgress?: (uploadFile: IUploadFile) => void;
  onLoadStart?: (uploadFile: IUploadFile) => void;
  onLoad?: (uploadFile: IUploadFile, result: any) => void;
}

const request = ({
  method,
  url,
  data,
  timeout = 30,
  onProgress = noop,
  onLoadStart = noop,
  onLoad = noop
}: IRequest) => {
  return new Promise((resolve, reject) => {
    const uploadFile: IUploadFile = {
      percent: 0,
      url: '',
      status: UPLOAD_STATUS.UPLOADING,
    };

    const xhr = new XMLHttpRequest();
    xhr.timeout = timeout * 1000;

    xhr.open(method, url);
    xhr.onloadstart = () => {
      onLoadStart(uploadFile);
    }

    xhr.onreadystatechange = (event: Event) => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse((event.target as any).response);
        onLoad(uploadFile, result);
        resolve(result);
      }
    }

    xhr.onabort = () => {}
    xhr.onerror = () => {
      uploadFile.status = UPLOAD_STATUS.ERROR;
      reject(new Error(`Server error`));
    }

    const onUploadProgress = (event: ProgressEvent) => {
      const { lengthComputable, loaded, total } = event;
      if (lengthComputable) {
        const percent = parseInt((loaded / total * 100).toFixed(2));
        uploadFile.percent = percent;

        if (percent >= 100) {
          uploadFile.status = UPLOAD_STATUS.DONE;
        }

        onProgress(uploadFile);
      }
    }

    xhr.onprogress = onUploadProgress;
    xhr.upload.onprogress = onUploadProgress;

    xhr.ontimeout = () => {
      uploadFile.status = UPLOAD_STATUS.ERROR;
      reject(new Error(`Request timeout`))
    }

    xhr.send(data)
  })
}

export default request;
