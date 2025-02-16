import SignInForm from '@/components/SignInForm'
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className='flex flex-col w-[300px]'>
        <p className='font-semibold text-2xl text-center mb-3'>Sign In</p>
        <p className='text-center text-sm text-gray-400 mb-5'>Please enter your email and password to sign in and access your dashboard.</p>
        <SignInForm />
        <p className='text-sm text-center text-gray-400 mt-2'>Don't have an account? <Link className='text-blue-500' href={'/sign-up'}>Sign Up!</Link></p>
    </div>
  )
}

export default page