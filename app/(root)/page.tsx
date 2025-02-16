import FilePath from '@/components/FilePath'
import FilesTable from '@/components/FilesTable'
import Header from '@/components/Header'
import { getAllDisks } from '@/lib/disks'
import { getUser } from '@/lib/users'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async () => {

  const user = await getUser()
  if(!user) redirect('/sign-in')
  const disks = await getAllDisks()
  console.log(disks)

  return (
    <div className='flex flex-col h-full w-full pr-4 py-4'>
      <Header user={user} />
      <div className='flex flex-col p-4 bg-black/35 rounded-md mt-4 flex-1'>
        <div className='flex justify-between items-center mb-4'>
          <FilePath folderId='0' />
        </div>
        <FilesTable files={disks} />
      </div>
    </div>
  )
}

export default page