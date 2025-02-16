import Header from '@/components/Header'
import SideBar from '@/components/SideBar';
import { getUser } from '@/lib/users';
import { redirect } from 'next/navigation';
import React, { ReactNode } from 'react'

export const dynamic = "force-dynamic";

const layout = async ({children}: {children: ReactNode}) => {

    const user = await getUser();

    if (!user) return redirect("/sign-in");

  return (
    <div className='w-full flex justify-center h-screen'>
      <SideBar />
      <div className='flex w-full h-full'>
        <div className='overflow-auto flex-1'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default layout