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

        const id = uuidv4()

        setProgress(prev => ([...prev, {id: id, value: 0, name: `Uploading ${files.length === 1 ? files[0].name : `${files.length} files`}`}]));

        let filesWithPath: any[] = []
        const formData = new FormData();
        
        formData.append("folderId", folderId);

        files.forEach((file, index) => {
            const fileExtension = file.name.split('.').pop(); 
            const fileNameWithoutExt = file.name.replace(`.${fileExtension}`, '');
            const uniqueFileName = `${fileNameWithoutExt}-${index + 1}.${fileExtension}`; 
            
            const renamedFile = new File([file], uniqueFileName, { type: file.type });
            filesWithPath.push({uniqueName: uniqueFileName, name: file.name, lastModifiedDate: file.lastModified, path: (file as any).path})

            formData.append("files", renamedFile);
        });


        formData.append("filesWithPath", JSON.stringify(filesWithPath))

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload", true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress(prev => prev.map(p => p.id === id ? { ...p, value: percent } : p));
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    setProgress(prev => prev.filter(p => p.id !== id));
                    toast.success('Files uploaded successfully')           
                } else {
                    toast.error(`Upload failed`)
                }
            };

            xhr.onerror = () => {
                console.error("Upload failed:", xhr.statusText, xhr.responseText);
                toast.error(`Upload failed`)
            };

            xhr.send(formData);
        });
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
                    <div key={item.id} className='rounded-md bg-[#1a1a1a] px-4 py-2.5 w-[200px]'>
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