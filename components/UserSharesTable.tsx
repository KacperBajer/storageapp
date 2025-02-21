import { File, Permissions, UserWithPermissions } from '@/lib/types'
import Image from 'next/image'
import React, { useState } from 'react'
import { FaTrash } from 'react-icons/fa6'
import ToggleButton from './ToggleButton'

type Props = {
    shares: UserWithPermissions[]
    file: File
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

const UserSharesTable = ({ shares, file }: Props) => {

    console.log(shares)

    const [permissionsState, setPermissionsState] = useState<UserPermissionsState>(() => {
        return shares.reduce((acc, user) => {
            acc[user.email] = {
                can_read: user.permissions?.can_read || false,
                can_write: user.permissions?.can_write || false,
                can_delete: user.permissions?.can_delete || false,
                can_manage: user.permissions?.can_manage || false,
            };
            return acc;
        }, {} as UserPermissionsState);
    });

    const togglePermission = (email: string, permission: keyof PermissionsState) => {
        setPermissionsState((prev) => ({
            ...prev,
            [email]: {
                ...prev[email],
                [permission]: !prev[email][permission],
            },
        }));
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
                </section>
                {shares?.map((item, index) => (
                    <div
                        key={index}
                        className={`flex ${shares.length !== index + 1 && "border-b border-dark-200"
                            } items-center`}
                    >
                        <div className="w-[200px] flex items-center pl-5 gap-2 py-2 flex-1">
                            <Image
                                alt=''
                                src={item.avatar}
                                width={24}
                                height={24}
                                className='w-6 h-6 rounded-full'
                            />
                            <p>{item.username}</p>
                        </div>
                        <div className="w-[300px] flex py-3">
                            <p>{item.email}</p>
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.email].can_read}
                                onToggle={() => togglePermission(item.email, 'can_read')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.email].can_write}
                                onToggle={() => togglePermission(item.email, 'can_write')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.email].can_delete}
                                onToggle={() => togglePermission(item.email, 'can_delete')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[70px] flex justify-center py-2">
                            <ToggleButton
                                isActive={permissionsState[item.email].can_manage}
                                onToggle={() => togglePermission(item.email, 'can_manage')}
                                isDisabled={file.user_id === item.id}
                            />
                        </div>
                        <div className="w-[50px] flex justify-center">
                            <button disabled={file.user_id === item.id} className="p-2.5 rounded-md bg-black/60">
                                <FaTrash className='text-red-500' />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserSharesTable