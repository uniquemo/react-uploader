import React, { useRef, useEffect, useState, useCallback } from 'react';
import Progress from 'components/Progress';
import request, { IFileProgress } from 'utils/request';

import './style.css';

export interface IUploaderProps {
  name: string;
  action: string;
}

const Uploader: React.FC<IUploaderProps> = ({ name, action }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [percentMap, setPercentMap] = useState<Record<string, number>>({});

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
    const file = event.dataTransfer!.files[0];
    setFiles([...files, file]);

    const formData = new FormData();
    formData.append(name, file);

    const result = await request({
      method: 'post',
      url: action,
      data: formData,
      onProgress: ({ percent }: IFileProgress) => {
        setPercentMap({
          ...percentMap,
          [file.name]: percent
        })
      }
    });
    console.log(`result => `, result);
  }, [action, files, name, percentMap])

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

  console.log(`files => `, files)

  return (
    <>
      <div className={`uploader`} ref={rootRef}>
        test
      </div>
      <div className={`uploader-progress`}>
        {files.map(({ name }: File, index: number) => (
          <div key={index}>
            <div>{name}</div>
            <Progress percent={percentMap[name]} />
          </div>
        ))}
      </div>
    </>
  )
}

export default Uploader;
