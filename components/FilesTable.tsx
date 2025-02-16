'use client'
import { File } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import React from 'react'
import { FaFolder } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { FaFile } from "react-icons/fa";

type Props = {
    files: File[]
}

const FilesTable = ({ files }: Props) => {

    return (
        <div className='overflow-x-auto'>
            <div className='flex flex-col'>
                <div className='flex border-b border-dark-200 items-center py-2 text-sm text-gray-300'>
                    <div className='w-[50px] flex justify-center'>
                        <div className='p-1.5 rounded-md bg-black/60'>
                            <FaFolder />
                        </div>
                    </div>
                    <div className='w-[50px] flex flex-1'>
                        <p>Name</p>
                    </div>
                    <div className='w-[150px] flex justify-center'>
                        <p>Type</p>
                    </div>
                    <div className='w-[150px] flex justify-center'>
                        <p>Uploaded</p>
                    </div>
                    <div className='w-[50px] flex justify-center'>
                        <div className='p-1.5 rounded-md bg-black/60 hover:cursor-pointer'>
                            <IoIosMore />
                        </div>                    
                    </div>
                </div>
                {files?.map(item => (
                    <div key={item.id} className='flex border-b border-dark-200 items-center'>
                        <div className='w-[50px] flex justify-center py-2'>
                            <div className='p-1.5 rounded-md bg-black/60'>
                                {item.type === 'folder' ? <FaFolder className='text-green-600' /> : <FaFile className='text-blue-600' />}
                            </div>
                        </div>
                        <Link href={`/folder/${item.id}`} className='w-[50px] flex flex-1 py-2'>
                            <p className='font-semibold'>{item.name}</p>
                        </Link>
                        <div className='w-[150px] flex justify-center py-2'>
                            <div className='py-1.5 px-4 rounded-md bg-black/60'>
                                <p className={`uppercase font-medium ${item.type === 'folder' ? 'text-green-600' : 'text-blue-600'} select-none text-sm`}>{item.type}</p>
                            </div>
                        </div>
                        <div className='w-[150px] flex justify-center py-2'>
                            <p>{formatDate(item.created_at)}</p>
                        </div>
                        <div className='w-[50px] flex justify-center py-2'>
                            <div className='p-1.5 rounded-md bg-black/60 hover:cursor-pointer'>
                                <IoIosMore />
                            </div>
                        </div>
                    </div>)
                )}
            </div>
        </div>
    )
}

export default FilesTable