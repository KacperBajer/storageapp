import { File, Permissions, UserWithPermissions } from '@/lib/types'
import Image from 'next/image'
import React, { useState } from 'react'
import { FaTrash } from 'react-icons/fa6'
import ToggleButton from './ToggleButton'
import { FaSave } from "react-icons/fa";
import { changePermissions, removePermissions } from '@/lib/permissions'
import { toast } from 'react-toastify'
import { FaCrown } from "react-icons/fa6";

type Props = {
    shares: UserWithPermissions[]
    file: File
    getData: () => void
}

type PermissionsState = {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
    can_manage: boolean
}

type UserPermissionsState = {
    [key: string]: PermissionsState
};

const UserSharesTable = ({ shares, file, getData }: Props) => {


    const [permissionsState, setPermissionsState] = useState<UserPermissionsState>(() => {
        return shares.reduce((acc, user) => {
            acc[user.id] = {
                can_read: user.permissions?.can_read || false,
                can_write: user.permissions?.can_write || false,
                can_delete: user.permissions?.can_delete || false,
                can_manage: user.permissions?.can_manage || false,
            };
            return acc;
        }, {} as UserPermissionsState);
    });

    const savePermissions = async (id: string) => {
        const userPermissions = permissionsState[id];
        const save = await changePermissions(id, file.type, file.id, userPermissions.can_read, userPermissions.can_write, userPermissions.can_delete, userPermissions.can_manage)
        if(save.status === 'error') {
            toast.error(save.error || 'Something went wrong')
            return
        }
        toast.success('Saved')
    }

    const deletePermissionsForUser = async (id: string) => {
        const res = await removePermissions(id, file.type, file.id)
        if(res.status === 'error') {
            toast.error(res.error || 'Something went wrong')
            return
        }
        toast.success('Removed')
        getData()
    }

    const togglePermission = (id: string, permission: keyof PermissionsState) => {
        setPermissionsState((prev) => {
            const updatedPermissions = {
                ...prev[id],
                [permission]: !prev[id][permission],
            };
    
            if (permission === "can_write" && updatedPermissions.can_write) {
                updatedPermissions.can_read = true;
            }

            if (permission === "can_delete" && updatedPermissions.can_delete) {
                updatedPermissions.can_read = true;
            }

            if (permission === "can_manage" && updatedPermissions.can_manage) {
                updatedPermissions.can_read = true;
                updatedPermissions.can_delete = true;
                updatedPermissions.can_write = true;
            }

            if (permission === "can_read" && !updatedPermissions.can_read) {
                updatedPermissions.can_write = false;
                updatedPermissions.can_delete = false;
                updatedPermissions.can_write = false;
                updatedPermissions.can_manage = false;
            }
    
            return {
                ...prev,
                [id]: updatedPermissions,
            };
        });
    };

    return (
        <div className="overflow-auto hideScrollbar">
            <div className="flex flex-col min-w-[600px]">
                <section className="flex border-b border-dark-200 items-center bg-dark-300 py-1 text-sm text-gray-300">
                    <div className="w-[200px] flex flex-1 pl-5">
                        <p>Username</p>
                    </div>
                    <div className="w-[300px] flex">
                        <p>Email</p>
                    </div>
                    <div className="w-[70px] flex justify-center">
                        <p>Read</p>
                    </div>
                    <div className="w-[70px] flex justify-center">
                        <p>Write</p>
                    </div>
                    <div className="w-[70px] flex justify-center">
                        <p>Delete</p>
                    </div>
                    <div className="w-[70px] flex justify-center">
                        <p>Manage</p>
                    </div>
                    <div className="w-[50px] flex justify-center">
                        <div className="p-2.5 rounded-md bg-black/60">
                            <FaTrash className='text-red-500' />
                        </div>
                    </div>
                    <div className="w-[50px] flex justify-center">
                        <div className="p-2.5 rounded-md bg-black/60">
                            <FaSave className='text-blue-600' />
                        </div>
                    </div>
                </section>
                {shares?.map((item, index) => (
                    <div
                        key={index}
                        className={`flex ${shares.length !== index + 1 && "border-b border-dark-200"
                            } items-center`}
                    >
                        <div className="w-[200px] flex items-center pl-5 py-2 flex-1">
                            <Image
                                alt=''
                                src={item.avatar}
                                width={24}
                                height={24}
                                className='w-6 h-6 rounded-full mr-2'
                            />
                            {file.user_id === item.id && <FaCrown className='text-yellow-500 mr-1' />}
                            <p className={`${file.user_id === item.id && 'text-yellow-500'}`}>{item.username}</p>
                        </div>
                        <div className="w-[300px] flex py-3">
                            <p>{item.email}</p>
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.id].can_read}
                                onToggle={() => togglePermission(item.id, 'can_read')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.id].can_write}
                                onToggle={() => togglePermission(item.id, 'can_write')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.id].can_delete}
                                onToggle={() => togglePermission(item.id, 'can_delete')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.id].can_manage}
                                onToggle={() => togglePermission(item.id, 'can_manage')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[50px] flex justify-center">
                            <button onClick={() => deletePermissionsForUser(item.id)} disabled={file.user_id === item.id} className="p-2.5 rounded-md bg-black/60">
                                <FaTrash className='text-red-500' />
                            </button>
                        </div>
                        <div className="w-[50px] flex justify-center">
                            <button onClick={() => savePermissions(item.id)} disabled={file.user_id === item.id} className="p-2.5 rounded-md bg-black/60">
                                <FaSave className='text-blue-600' />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserSharesTable