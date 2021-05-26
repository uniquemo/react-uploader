import React, { useRef, useEffect, useState } from 'react';

import './style.css';

export interface IUploaderProps {
  name: string;
  action: string;
}

const Uploader: React.FC<IUploaderProps> = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState([]);

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

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(`event.dataTransfer.files => `, event.dataTransfer!.files);
  }

  useEffect(() => {
    const rootDom = rootRef.current;
    rootDom?.addEventListener('dragenter', onDragEnter);
    rootDom?.addEventListener('dragover', onDragOver);
    rootDom?.addEventListener('dragleave', onDragLeave);
    rootDom?.addEventListener('drop', onDrop);

    return () => {
      rootDom?.removeEventListener('dragenter', onDragEnter);
      rootDom?.removeEventListener('dragover', onDragOver);
      rootDom?.removeEventListener('dragleave', onDragLeave);
      rootDom?.removeEventListener('drop', onDrop);
    }
  }, [])

  return (
    <div className={`uploader`} ref={rootRef}>
      upload
    </div>
  )
}

export default Uploader;
