import React, { useRef, useEffect, useState, useCallback } from 'react';
import Progress from 'components/Progress';
import request, { IUploadFile } from 'utils/request';

import './style.scss';

export interface IUploaderProps {
  name: string;
  action: string;
}

const Uploader: React.FC<IUploaderProps> = ({ name, action }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [uploadFiles, setUploadFiles] = useState<IUploadFile[]>([]);

  const upload = useCallback(async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append(name, file);

      await request({
        method: 'post',
        url: action,
        data: formData,
        onLoadStart: (uploadFile: IUploadFile) => {
          uploadFile.file = file;
          uploadFiles.push(uploadFile);
          setUploadFiles([...uploadFiles]);
        },
        onLoad: (uploadFile: IUploadFile, result: any) => {
          uploadFile.url = result.url;
          setUploadFiles([...uploadFiles]);
        },
        onProgress: (uploadFile: IUploadFile) => {
          setUploadFiles([...uploadFiles]);
        }
      });
    }
  }, [action, name, uploadFiles])

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
      upload(event.dataTransfer!.files);
    }
  }, [upload])

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    upload(event.target.files as FileList);
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

  return (
    <>
      <div className={`uploader`} ref={rootRef}>
        <input type='file' onChange={onFileInputChange} />
        Drag or Click to upload
      </div>
      <div className={`uploader-progress`}>
        {uploadFiles.map(({ file, percent, url }: IUploadFile, index: number) => (
          <div key={index} className={`uploader-progress-item`}>
            <div className={`uploader-progress-item-name`}>
              {file!.name}{`（${percent}%）`}
              {url && <a href={url} target='_blank' rel='noreferrer'>Link</a>}
            </div>
            <Progress percent={percent || 0} />
          </div>
        ))}
      </div>
    </>
  )
}

export default Uploader;
