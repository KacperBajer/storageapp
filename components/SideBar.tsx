'use client'
import { SideBarLinks } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const SideBar = () => {

    const path = usePathname()

    return (
        <div className='p-4 sticky h-screen'>
            <div className='w-[300px] bg-black/35 rounded-md px-4 py-7 h-full'>
                <div className='flex flex-col overflow-y-auto'>
                    
                    <section className='flex justify-center mb-16'>
                        <Link
                            href={'/'}
                            className='flex items-center gap-2'
                        >
                            <Image
                                alt='Logo'
                                src={'/logo.png'}
                                width={1000}
                                height={1000}
                                className='h-12 w-fit'
                            />
                            <p className='text-3xl font-semibold'>Storage</p>
                        </Link>
                    </section>

                    <section className='flex flex-col gap-2'>
                        {SideBarLinks.map((item, index) => (
                            <Link
                                href={item.path}
                                key={index}
                                className={`flex items-center gap-3 hover:bg-black/20  ${path === item.path || (item.path === '/' && path.startsWith('/folder/')) ? 'bg-black/40 text-blue-600' : 'border-transparent'} rounded-md px-4 py-1.5`}
                            >
                                {item.icon}
                                <p>{item.title}</p>
                            </Link>
                        ))}
                    </section>
                
                </div>
            </div>
        </div>
    )
}

export default SideBar