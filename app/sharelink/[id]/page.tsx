import { executeLink } from '@/lib/links'
import Image from 'next/image'
import React from 'react'

const page = async ({ params }: { params?: Promise<any> }) => {

  const {id} = await params
  const data = await executeLink(id)

  return (
    <div className='flex min-h-screen justify-center items-center'>
      <div className='bg-dark-300 p-10 flex flex-col items-center rounded-md'>
        <Image
          alt={data.status === 'error' ? 'error' : 'success'}
          src={data.status === 'error' ? '/error.png' : '/check.png'}
          width={150}
          height={150}
          className='w-[150px] h-[150px]'
        />
        <p className='mt-5 text-xs text-gray-200'>{data.status === 'error' ? data.error : 'The operation was completed successfully'}</p>
      </div>
    </div>
  )
}

export default page