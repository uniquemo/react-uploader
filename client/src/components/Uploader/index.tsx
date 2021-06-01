import React, { useRef, useEffect, useState, useCallback } from 'react';
import Progress from 'components/Progress';
import request from 'utils/request';
import { createChunks } from 'utils/file';
import { IFilePart, IUploadedFile } from 'types/index';

import './style.scss';

export interface IUploaderProps {
  name: string;
  action: string;
}

const MAX_ACTIVE_REQ_COUNT = 4;
const CONCURRENT_MODE = true;

const Uploader: React.FC<IUploaderProps> = ({ name, action }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [currentFile, setCurrentFile] = useState<File>();
  const [objectURL, setObjectURL] = useState<string>('');
  const [hashPercent, setHashPercent] = useState<number>(0);
  const [filename, setFilename] = useState<string>('');
  const [partList, setPartList] = useState<IFilePart[]>([]);

  const calculateHash = (partList: IFilePart[]) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('/hash.js');
      worker.postMessage({ partList });
      worker.onmessage = (event) => {
        const { percent, hash } = event.data;
        setHashPercent(percent);
        if (hash) {
          resolve(hash);
        }
      }
    });
  }

  const handlePause = () => {
    partList.forEach((part: IFilePart) => part.xhr && part.xhr.abort());
  }

  const handleResume = async () => {
    await uploadParts(partList, filename);
  }

  const handleUpload = async () => {
    if (!currentFile) return;

    const partList: IFilePart[] = createChunks(currentFile);
    const fileHash = await calculateHash(partList);
    const lastDotIndex = currentFile.name.lastIndexOf('.');
    const extName = currentFile.name.slice(lastDotIndex);
    const filename = `${fileHash}${extName}`;
    setFilename(filename);

    partList.forEach((item: IFilePart, index: number) => {
      item.filename = filename;
      item.chunkName = `${filename}-${index}`;
      item.loaded = 0;
      item.percent = 0;
    });
    setPartList(partList);
    await uploadParts(partList, filename);
  }

  const verify = async (filename: string) => {
    return await request({
      url: `/verify/${filename}`
    });
  }

  const uploadParts = async (partList: IFilePart[], filename: string) => {
    const { needUpload, uploadList } = await verify(filename);
    if (!needUpload) {
      partList.forEach((item: IFilePart) => item.percent = 100);
      setPartList([...partList]);
      return window.alert('秒传成功');
    }

    try {
      if (CONCURRENT_MODE) {
        createConcurrentRequests(partList, uploadList, filename);
      } else {
        const requests = createRequests(partList, uploadList, filename);
        await Promise.all(requests);
        await request({ url: `/merge/${filename}` });
        window.alert(`上传成功`);
      }
    } catch (error) {
      window.alert('上传失败或暂停');
    }
  }

  // 添加并发请求数控制
  const createConcurrentRequests = async (partList: IFilePart[], uploadList: IUploadedFile[], filename: string) => {
    let activeReqCount = 0;
    let successReqCount = 0;

    const partListWaiting = partList.filter((part: IFilePart) => {
      const uploadFile = uploadList.find(item => item.filename === part.chunkName);
      if (!uploadFile) {
        part.loaded = 0;
        part.percent = 0;
        return true;
      }
      if (uploadFile.size < part.chunk.size) {
        part.loaded = uploadFile.size;
        part.percent = Number((part.loaded / part.chunk.size * 100).toFixed(2));
        return true;
      }
      part.percent = 100;
      return false;
    });

    const targetReqCount = partListWaiting.length;

    const doRequest = () => {
      while (activeReqCount < MAX_ACTIVE_REQ_COUNT && partListWaiting.length) {
        const part = partListWaiting.shift() as IFilePart;
        activeReqCount += 1;

        request({
          url: `/upload/${filename}/${part.chunkName}/${part.loaded}`,
          method: 'post',
          headers: { 'Content-Type': 'application/octet-stream' },
          setXHR: (xhr: XMLHttpRequest) => part.xhr = xhr,
          onProgress: (event: ProgressEvent) => {
            part.percent = Number(((part.loaded! + event.loaded) / part.chunk.size * 100).toFixed(2));
            console.log('part.percent', part.chunkName, part.percent);
            setPartList([...partList]);
          },
          data: part.chunk.slice(part.loaded)
        // eslint-disable-next-line no-loop-func
        }).then(async () => {
          activeReqCount -= 1;
          successReqCount += 1;
          if (successReqCount !== targetReqCount) {
            doRequest();
          } else if (successReqCount === targetReqCount) {
            await request({ url: `/merge/${filename}` });
            window.alert(`上传成功`);
          }
        })
      }
    }

    doRequest();
  }

  const createRequests = (partList: IFilePart[], uploadList: IUploadedFile[], filename: string) => {
    return partList.filter((part: IFilePart) => {
      const uploadFile = uploadList.find(item => item.filename === part.chunkName);
      if (!uploadFile) {
        part.loaded = 0;
        part.percent = 0;
        return true;
      }
      if (uploadFile.size < part.chunk.size) {
        part.loaded = uploadFile.size;
        part.percent = Number((part.loaded / part.chunk.size * 100).toFixed(2));
        return true;
      }
      return false;
    }).map((part: IFilePart) => {
      return request({
        url: `/upload/${filename}/${part.chunkName}/${part.loaded}`,
        method: 'post',
        headers: { 'Content-Type': 'application/octet-stream' },
        setXHR: (xhr: XMLHttpRequest) => part.xhr = xhr,
        onProgress: (event: ProgressEvent) => {
          part.percent = Number(((part.loaded! + event.loaded) / part.chunk.size * 100).toFixed(2));
          console.log('part.percent', part.chunkName, part.percent);
          setPartList([...partList]);
        },
        data: part.chunk.slice(part.loaded)
      })
    })
  }

  const checkHealth = async () => {
    await request({
      url: '/health'
    });
    window.alert('check health success');
  }

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  const onDrop = useCallback(async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer!.files) {
      setCurrentFile(event.dataTransfer!.files[0]);
    }
  }, [])

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFile(event.target.files![0]);
  }

  useEffect(() => {
    const rootDom = rootRef.current;
    rootDom!.addEventListener('dragenter', onDragEnter);
    rootDom!.addEventListener('dragover', onDragOver);
    rootDom!.addEventListener('dragleave', onDragLeave);
    rootDom!.addEventListener('drop', onDrop);

    return () => {
      rootDom!.removeEventListener('dragenter', onDragEnter);
      rootDom!.removeEventListener('dragover', onDragOver);
      rootDom!.removeEventListener('dragleave', onDragLeave);
      rootDom!.removeEventListener('drop', onDrop);
    }
  }, [onDrop])

  useEffect(() => {
    if (currentFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setObjectURL(reader.result as string));
      reader.readAsDataURL(currentFile);
    }
  }, [currentFile])

  return (
    <>
      <div className={`uploader`} ref={rootRef}>
        <input type='file' onChange={onFileInputChange} />
        Drag or Click to upload
      </div>
      {objectURL && (
        <div>
          <img src={objectURL} style={{ width: 100 }} alt='' />
        </div>
      )}
      <div>
        <button onClick={handleUpload}>上传</button>
        <button onClick={handlePause}>暂停</button>
        <button onClick={handleResume}>继续</button>
      </div>
      <hr />
      <div>
        <button onClick={checkHealth}>测试上传过程中，并发数是 4，仍然可以发起其他请求</button>
      </div>
      <hr />

      <div>
        <div>hash percent：{`${hashPercent}%`}</div>
        <Progress percent={hashPercent} />
      </div>

      <div className={`uploader-progress`}>
        {partList.map(({ chunkName, percent }: IFilePart, index: number) => (
          <div key={index} className={`uploader-progress-item`}>
            <div className={`uploader-progress-item-name`}>
              {chunkName}{`（${percent}%）`}
            </div>
            <Progress percent={percent || 0} />
          </div>
        ))}
      </div>
    </>
  )
}

export default Uploader;
