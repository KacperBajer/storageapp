import { getFolderPath } from '@/lib/files'
import Link from 'next/link'
import React from 'react'

type Props = {
  folderId: string
}

const FilePath = async ({ folderId }: Props) => {

  const path = await getFolderPath(folderId)
  console.log(path)

  return (
    <div className='flex'>
      <Link
        href={'/'}
      >
        <p>/disks/</p>
      </Link>
      {path?.map(item => (
        <Link
          key={item.id}
          href={`/${item.id}`}
        >
          <p>{item.name}/</p>
        </Link>
      ))}
    </div>
  )
}

export default FilePath