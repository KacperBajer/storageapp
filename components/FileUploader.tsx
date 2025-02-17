'use client'
import { UploadedFile } from '@/lib/types';
import { uploadFiles } from '@/lib/uploadFiles';
import React, { useState } from 'react'
import Dropzone from 'react-dropzone'
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

type Props = {
    folderId: string
}

type Progress = {
    id: string
    value: number
    name: string
}

const FileUploader = ({folderId}: Props) => {
    
    const [progress, setProgress] = useState<Progress[]>([]);

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return;

        const id = Math.random().toString(36).substring(7);
        setProgress(prev => [...prev, { id, value: 0, name: `Uploading ${files.length} file(s)` }]);

        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload", true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress(prev => prev.map(p => (p.id === id ? { ...p, value: percent } : p)));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setProgress(prev => prev.filter(p => p.id !== id));
                    toast.success('Files uploaded successfully');
                } else {
                    toast.error('Upload failed');
                }
            };

            xhr.onerror = () => {
                toast.error('Upload error');
            };

            xhr.send(formData);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload error');
        }
    };

    return (
        <>
            <Dropzone onDrop={acceptedFiles => handleUpload(acceptedFiles)}>
                {({ getRootProps, getInputProps }) => (
                    <section>
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <button className='py-1.5 px-4 bg-black/60 rounded-md'>Upload</button>
                        </div>
                    </section>
                )}
            </Dropzone>
            {progress.length > 0 && <div className='absolute bottom-5 right-5 flex flex-col gap-2'>
                {progress.map(item => (
                    <div key={item.id} className='rounded-md bg-black/45 px-4 py-2.5 w-[200px]'>
                        <p className='text-center mb-2 text-sm'>{item.name}</p>
                        <div className='flex relative w-full'>
                            <div className='w-full h-1 rounded-full bg-dark-300'></div>
                            <div style={{width: `${item.value}%`}} className={`left-0 top-0 absolute z-10 h-1 rounded-full bg-blue-500`}></div>
                        </div>
                        <p className='text-center mt-1 text-xs'>{item.value}%</p>
                    </div>
                ))}
            </div>}
        </>
    )
}

export default FileUploader