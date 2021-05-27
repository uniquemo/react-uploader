import { noop } from 'utils/tool';

export interface IFileProgress {
  file: FormDataEntryValue;
  percent: number;
}

export interface IRequest {
  method: 'get' | 'post';
  url: string;
  data?: any;
  timeout?: number;
  onProgress?: (progress: IFileProgress) => void;
}

const request = ({
  method,
  url,
  data,
  timeout = 30,
  onProgress = noop,
}: IRequest) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeout * 1000;

    xhr.open(method, url);
    xhr.onreadystatechange = (event: Event) => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse((event.target as any).response));
      }
    }
    xhr.onabort = () => {}
    xhr.onerror = () => {}

    xhr.onprogress = (event: ProgressEvent) => {
      const { lengthComputable, loaded, total } = event;
      if (lengthComputable) {
        const percent = loaded / total * 100;
        console.log(`percent => `, percent)
        for (let val of (data as FormData).values()) {
          onProgress({
            percent,
            file: val
          })
        }
      }
    }

    xhr.ontimeout = () => {
      reject(new Error(`Request timeout`))
    }

    xhr.send(data)
  })
}

export default request;
