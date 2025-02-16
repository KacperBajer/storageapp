import { getUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import React, { ReactNode } from 'react'

export const dynamic = "force-dynamic";

const layout = async ({ children }: { children: ReactNode }) => {


    const user = await getUser();

    if (user) return redirect("/");

    return (
        <div className='w-full min-h-screen flex justify-center items-center'>
            <div className='p-5'>
                <div className='p-5 rounded-md border-2 border-dark-200'>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default layout