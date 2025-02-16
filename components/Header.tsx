import { User } from '@/lib/types'
import Image from 'next/image'
import React from 'react'

type Props = {
    user: User
}

const Header = ({ user }: Props) => {
    return (
        <div className='flex justify-between items-center gap-4 p-2 bg-black/35 rounded-md'>
           <input
                className='w-full max-w-[500px] bg-black/45 rounded-md py-1.5 px-4 appearance-none outline-none'
                placeholder='Search'
           />
            <Image
                alt='Profile'
                src={user.avatar}
                width={40}
                height={40}
                className='rounded-full w-10 h-10 hover:cursor-pointer'
            />
        </div>
    )
}

export default Header