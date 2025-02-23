'use client'
import { getZips } from '@/lib/files'
import { addUserToShare, generateLink, getShares } from '@/lib/permissions'
import { File, Permissions, User, UserWithPermissions, Zip } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import UserSharesTable from './UserSharesTable'
import { toast } from 'react-toastify'

type Props = {
    handleClose: () => void
    file: File
    user: User
}

const SharePopup = ({ handleClose, file, user }: Props) => {
    const [data, setData] = useState<UserWithPermissions[]>([])
    const [zips, setZips] = useState<Zip[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const boxRef = useRef<HTMLDivElement | null>(null);
    const [email, setEmail] = useState('')

    const getData = async () => {
        const resData = await getShares(file.id, file.type)
        const resZips = await getZips(file.id)
        setZips(resZips)
        setData(resData)
        setIsLoading(false)
    }

    const createLink = async () => {
        const generate = await generateLink('share', file.type, file.id, user.id)
        if(generate.status === 'error') {
            toast.error(generate.error || 'Something went wrong')
            return
        }
        navigator.clipboard.writeText(generate.link as string)
        toast.success("Link copied")
    }
    
    const addUser = async (e: FormEvent) => {
        e.preventDefault()
        const res = await addUserToShare(file.type, file.id, email)
        if(res.status === 'error') {
            toast.error(res.error || 'Something went wrong')
            return
        }
        toast.success('User added')
        getData()
    }

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (isLoading) {
        return <div className="fixed top-0 left-0 z-30 w-full h-screen items-center bg-black/30"></div>
    }

    return (
        <div className="fixed top-0 left-0 z-30 w-full h-screen flex justify-center items-center bg-black/30">
            <div
                className="rounded-md p-4 bg-dark-300 border border-dark-200"
                ref={boxRef}
            >
                <p className="text-3xl font-semibold text-center mb-5">Share</p>
                <UserSharesTable file={file} shares={data} getData={getData} />
                <div className='gap-2 flex mt-3 w-full'>
                    <form onSubmit={addUser} className='flex gap-2'>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} className='appearance-none outline-none rounded-md border border-dark-200 py-1.5 px-4 bg-transparent' placeholder='Email' type='email' />
                        <button className='bg-blue-600 px-4 py-1.5 rounded-md text-sm'>Add User</button>
                    </form>
                    <button onClick={createLink} className='bg-black/50 px-4 py-1.5 rounded-md text-sm'>Create invite link</button>
                </div>
            </div>
        </div>
    );
}

export default SharePopup